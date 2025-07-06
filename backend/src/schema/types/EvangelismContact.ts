/**
 * PURPOSE: Evangelism contact management GraphQL types and resolvers
 * - Handles street evangelism contact tracking
 * - Implements hierarchical data visibility (Director sees all, Region Leader sees region, etc.)
 * - Provides CRUD operations with proper authorization
 * - Manages follow-up tracking and contact status
 */

import {
  objectType,
  extendType,
  nonNull,
  stringArg,
  arg,
  booleanArg,
} from "nexus";

export const EvangelismContact = objectType({
  name: "EvangelismContact",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("contactName");
    t.string("contactInfo");
    t.string("location");
    t.string("notes");
    t.field("followedUpDate", { type: "DateTime" });
    t.nonNull.boolean("contacted");
    t.nonNull.field("createdAt", { type: "DateTime" });
    t.nonNull.field("updatedAt", { type: "DateTime" });

    t.nonNull.field("createdBy", {
      type: "User",
      resolve: (parent, _, context) => {
        return context.prisma.user.findUniqueOrThrow({
          where: { id: parent.createdById },
        });
      },
    });
  },
});

export const EvangelismContactQuery = extendType({
  type: "Query",
  definition(t) {
    t.list.field("evangelismContacts", {
      type: "EvangelismContact",
      resolve: async (_, __, context) => {
        if (!context.currentUser) {
          throw new Error("Not authenticated");
        }

        // Get contacts based on user role and hierarchy
        const contacts = await getContactsForUser(
          context.currentUser,
          context.prisma
        );
        return contacts;
      },
    });
  },
});

export const EvangelismContactMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createEvangelismContact", {
      type: "EvangelismContact",
      args: {
        contactName: nonNull(stringArg()),
        contactInfo: stringArg(),
        location: stringArg(),
        notes: stringArg(),
        followUpDate: arg({ type: "DateTime" }),
      },
      resolve: (_, args, context) => {
        if (!context.currentUser) {
          throw new Error("Not authenticated");
        }

        return context.prisma.evangelismContact.create({
          data: {
            ...args,
            createdById: context.currentUser.id,
          },
        });
      },
    });

    t.field("updateEvangelismContact", {
      type: "EvangelismContact",
      args: {
        id: nonNull(stringArg()),
        contactName: stringArg(),
        contactInfo: stringArg(),
        location: stringArg(),
        notes: stringArg(),
        followUpDate: arg({ type: "DateTime" }),
        contacted: booleanArg(),
      },
      resolve: async (_, { id, ...args }, context) => {
        if (!context.currentUser) {
          throw new Error("Not authenticated");
        }

        // Check if user has permission to update this contact
        const contact = await context.prisma.evangelismContact.findUnique({
          where: { id },
          include: { createdBy: true },
        });

        if (!contact) {
          throw new Error("Contact not found");
        }

        const hasPermission = await canUserModifyContact(
          context.currentUser,
          contact,
          context.prisma
        );
        if (!hasPermission) {
          throw new Error("Not authorized to modify this contact");
        }

        return context.prisma.evangelismContact.update({
          where: { id },
          data: args,
        });
      },
    });
  },
});

// Helper functions for role-based access
async function getContactsForUser(user: any, prisma: any) {
  switch (user.role) {
    case "DIRECTOR":
      return prisma.evangelismContact.findMany({
        include: { createdBy: true },
        orderBy: { createdAt: "desc" },
      });

    case "REGION_LEADER":
      // Get all contacts from users in this region
      const regionProfile = await prisma.regionLeaderProfile.findUnique({
        where: { userId: user.id },
        include: { region: { include: { groups: true } } },
      });

      if (!regionProfile) return [];

      const groupIds = regionProfile.region.groups.map((g: any) => g.id);
      const userIds = await prisma.user.findMany({
        where: {
          OR: [
            { groupLeaderProfile: { groupId: { in: groupIds } } },
            { groupMemberProfile: { groupId: { in: groupIds } } },
          ],
        },
        select: { id: true },
      });

      return prisma.evangelismContact.findMany({
        where: {
          createdById: { in: [user.id, ...userIds.map((u: any) => u.id)] },
        },
        include: { createdBy: true },
        orderBy: { createdAt: "desc" },
      });

    case "GROUP_LEADER":
      // Get all contacts from users in this group
      const groupProfile = await prisma.groupLeaderProfile.findUnique({
        where: { userId: user.id },
      });

      if (!groupProfile) return [];

      const groupMemberIds = await prisma.groupMemberProfile.findMany({
        where: { groupId: groupProfile.groupId },
        select: { userId: true },
      });

      return prisma.evangelismContact.findMany({
        where: {
          createdById: {
            in: [user.id, ...groupMemberIds.map((m: any) => m.userId)],
          },
        },
        include: { createdBy: true },
        orderBy: { createdAt: "desc" },
      });

    case "GROUP_MEMBER":
      // Only see own contacts
      return prisma.evangelismContact.findMany({
        where: { createdById: user.id },
        include: { createdBy: true },
        orderBy: { createdAt: "desc" },
      });

    default:
      return [];
  }
}

async function canUserModifyContact(user: any, contact: any, prisma: any) {
  // Users can always modify their own contacts
  if (contact.createdById === user.id) return true;

  // Directors can modify any contact
  if (user.role === "DIRECTOR") return true;

  // Region leaders can modify contacts from their region
  if (user.role === "REGION_LEADER") {
    const regionProfile = await prisma.regionLeaderProfile.findUnique({
      where: { userId: user.id },
      include: { region: { include: { groups: true } } },
    });

    if (!regionProfile) return false;

    const groupIds = regionProfile.region.groups.map((g: any) => g.id);
    const contactCreatorGroup = await prisma.user.findUnique({
      where: { id: contact.createdById },
      include: {
        groupLeaderProfile: true,
        groupMemberProfile: true,
      },
    });

    if (!contactCreatorGroup) return false;

    const creatorGroupId =
      contactCreatorGroup.groupLeaderProfile?.groupId ||
      contactCreatorGroup.groupMemberProfile?.groupId;

    return creatorGroupId && groupIds.includes(creatorGroupId);
  }

  // Group leaders can modify contacts from their group members
  if (user.role === "GROUP_LEADER") {
    const groupProfile = await prisma.groupLeaderProfile.findUnique({
      where: { userId: user.id },
    });

    if (!groupProfile) return false;

    const contactCreatorProfile = await prisma.groupMemberProfile.findUnique({
      where: { userId: contact.createdById },
    });

    return contactCreatorProfile?.groupId === groupProfile.groupId;
  }

  return false;
}

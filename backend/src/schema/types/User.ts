/**
 * PURPOSE: User-related GraphQL types and resolvers
 * - Defines User type with role-based data access
 * - Handles user authentication and authorization
 * - Provides queries for getting current user and user lists
 */

import {
  objectType,
  extendType,
  nonNull,
  stringArg,
  arg,
  booleanArg,
} from "nexus";

// GraphQL type for evangelism contacts
// Represents people contacted during street evangelism activities
export const EvangelismContact = objectType({
  name: "EvangelismContact",
  definition(t) {
    // Contact identification and basic info
    t.nonNull.string("id");
    t.nonNull.string("contactName"); // Person's name
    t.string("contactInfo"); // Phone/email/address
    t.string("location"); // Where they were contacted
    t.string("notes"); // Conversation notes, prayer requests
    t.field("followUpDate", { type: "DateTime" }); // When to follow up
    t.nonNull.boolean("contacted"); // Has follow-up been completed?
    t.nonNull.field("createdAt", { type: "DateTime" });
    t.nonNull.field("updatedAt", { type: "DateTime" });

    // Reference to the user who made this contact
    // Important for determining data visibility permissions
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

// Query to get evangelism contacts with role-based filtering
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
        // Directors see all, Region Leaders see their region, etc.
        const contacts = await getContactsForUser(
          context.currentUser,
          context.prisma
        );
        return contacts;
      },
    });
  },
});

// Mutations for creating and updating evangelism contacts
export const EvangelismContactMutation = extendType({
  type: "Mutation",
  definition(t) {
    // Create a new evangelism contact
    t.field("createEvangelismContact", {
      type: "EvangelismContact",
      args: {
        contactName: nonNull(stringArg()), // Required: person's name
        contactInfo: stringArg(), // Optional: phone/email
        location: stringArg(), // Optional: where contacted
        notes: stringArg(), // Optional: conversation notes
        followUpDate: arg({ type: "DateTime" }), // Optional: when to follow up
      },
      resolve: (_, args, context) => {
        if (!context.currentUser) {
          throw new Error("Not authenticated");
        }

        // Create contact and link it to the current user
        return context.prisma.evangelismContact.create({
          data: {
            ...args,
            createdById: context.currentUser.id,
          },
        });
      },
    });

    // Update an existing evangelism contact
    t.field("updateEvangelismContact", {
      type: "EvangelismContact",
      args: {
        id: nonNull(stringArg()), // Required: contact ID
        contactName: stringArg(), // Optional updates
        contactInfo: stringArg(),
        location: stringArg(),
        notes: stringArg(),
        followUpDate: arg({ type: "DateTime" }),
        contacted: booleanArg(), // Mark as contacted/pending
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

        // Verify user has permission to modify this contact
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

/**
 * HELPER FUNCTION: Get contacts based on user role and hierarchy
 * Implements the cascading permission system:
 * - Directors: See all contacts from everyone
 * - Region Leaders: See contacts from all users in their region
 * - Group Leaders: See contacts from all users in their group
 * - Group Members: See only their own contacts
 */
async function getContactsForUser(user: any, prisma: any) {
  switch (user.role) {
    case "DIRECTOR":
      // Directors see everything
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

      // Find all groups in this region
      const groupIds = regionProfile.region.groups.map((g: any) => g.id);

      // Find all users in these groups
      const userIds = await prisma.user.findMany({
        where: {
          OR: [
            { groupLeaderProfile: { groupId: { in: groupIds } } },
            { groupMemberProfile: { groupId: { in: groupIds } } },
          ],
        },
        select: { id: true },
      });

      // Return contacts from region leader and all users in their region
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

      // Find all group members
      const groupMemberIds = await prisma.groupMemberProfile.findMany({
        where: { groupId: groupProfile.groupId },
        select: { userId: true },
      });

      // Return contacts from group leader and all group members
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

/**
 * HELPER FUNCTION: Check if user can modify a specific contact
 * Authorization rules:
 * - Users can always modify their own contacts
 * - Directors can modify any contact
 * - Region Leaders can modify contacts from their region
 * - Group Leaders can modify contacts from their group members
 */
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

        const contactCreatorProfile =
          await prisma.groupMemberProfile.findUnique({
            where: { userId: contact.createdById },
          });

        return contactCreatorProfile?.groupId === groupProfile.groupId;
      }

      return false;
    }
  }
}

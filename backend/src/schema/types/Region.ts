/**
 * PURPOSE: Region and Group management GraphQL types and resolvers
 * - Handles the organizational structure (Regions contain Groups)
 * - Allows flexible creation of new regions and groups
 * - Implements role-based visibility and creation permissions
 * - Provides hierarchical data relationships
 */

import { objectType, extendType, nonNull, stringArg } from "nexus";

// GraphQL type for regions (geographic or organizational divisions)
// Regions are the top-level organizational units containing multiple groups
export const Region = objectType({
  name: "Region",
  definition(t) {
    // Basic region information
    t.nonNull.string("id");
    t.nonNull.string("name"); // Region name (e.g., "North District", "Downtown Area")
    t.string("description"); // Optional description
    t.nonNull.field("createdAt", { type: "DateTime" });
    t.nonNull.field("updatedAt", { type: "DateTime" });

    // Get all region leaders for this region
    // A region can have multiple leaders for redundancy/coverage
    t.list.field("regionLeaders", {
      type: "User",
      resolve: async (parent, _, context) => {
        const profiles = await context.prisma.regionLeaderProfile.findMany({
          where: { regionId: parent.id },
          include: { user: true },
        });
        return profiles.map((p: any) => p.user);
      },
    });

    // Get all groups within this region
    // Groups are the basic organizational units for evangelism work
    t.list.field("groups", {
      type: "Group",
      resolve: (parent, _, context) => {
        return context.prisma.group.findMany({
          where: { regionId: parent.id },
        });
      },
    });
  },
});

// GraphQL type for groups (teams within regions)
// Groups are where the actual evangelism work is organized
export const Group = objectType({
  name: "Group",
  definition(t) {
    // Basic group information
    t.nonNull.string("id");
    t.nonNull.string("name"); // Group name (e.g., "Team Alpha", "Saturday Morning Group")
    t.string("description"); // Optional description
    t.nonNull.field("createdAt", { type: "DateTime" });
    t.nonNull.field("updatedAt", { type: "DateTime" });

    // Reference to the region this group belongs to
    t.nonNull.field("region", {
      type: "Region",
      resolve: (parent, _, context) => {
        return context.prisma.region.findUniqueOrThrow({
          where: { id: parent.regionId },
        });
      },
    });

    // Get all group leaders for this group
    // A group can have multiple leaders
    t.list.field("groupLeaders", {
      type: "User",
      resolve: async (parent, _, context) => {
        const profiles = await context.prisma.groupLeaderProfile.findMany({
          where: { groupId: parent.id },
          include: { user: true },
        });
        return profiles.map((p: any) => p.user);
      },
    });

    // Get all group members for this group
    // These are the people doing the evangelism work
    t.list.field("groupMembers", {
      type: "User",
      resolve: async (parent, _, context) => {
        const profiles = await context.prisma.groupMemberProfile.findMany({
          where: { groupId: parent.id },
          include: { user: true },
        });
        return profiles.map((p: any) => p.user);
      },
    });
  },
});

// Queries for getting regions with role-based filtering
export const RegionQuery = extendType({
  type: "Query",
  definition(t) {
    t.list.field("regions", {
      type: "Region",
      resolve: async (_, __, context) => {
        if (!context.currentUser) {
          throw new Error("Not authenticated");
        }

        // Role-based visibility:
        // Directors see all regions (for management)
        if (context.currentUser.role === "DIRECTOR") {
          return context.prisma.region.findMany({
            orderBy: { name: "asc" },
          });
        }

        // Region leaders see only their region
        if (context.currentUser.role === "REGION_LEADER") {
          const profile = await context.prisma.regionLeaderProfile.findUnique({
            where: { userId: context.currentUser.id },
            include: { region: true },
          });
          return profile ? [profile.region] : [];
        }

        // Group leaders see their region (to understand context)
        if (context.currentUser.role === "GROUP_LEADER") {
          const profile = await context.prisma.groupLeaderProfile.findUnique({
            where: { userId: context.currentUser.id },
            include: { group: { include: { region: true } } },
          });
          return profile ? [profile.group.region] : [];
        }

        // Group members see their region (to understand context)
        if (context.currentUser.role === "GROUP_MEMBER") {
          const profile = await context.prisma.groupMemberProfile.findUnique({
            where: { userId: context.currentUser.id },
            include: { group: { include: { region: true } } },
          });
          return profile ? [profile.group.region] : [];
        }

        return [];
      },
    });
  },
});

// Mutations for creating regions and groups
export const RegionMutation = extendType({
  type: "Mutation",
  definition(t) {
    // Create a new region (admin function)
    t.field("createRegion", {
      type: "Region",
      args: {
        name: nonNull(stringArg()),
        description: stringArg(),
      },
      resolve: (_, args, context) => {
        if (!context.currentUser || context.currentUser.role !== "DIRECTOR") {
          throw new Error("Only directors can create regions");
        }

        return context.prisma.region.create({
          data: args,
        });
      },
    });
    // Create a new group within a region
    t.field("createGroup", {
      type: "Group",
      args: {
        name: nonNull(stringArg()),
        description: stringArg(),
        regionId: nonNull(stringArg()),
      },
      resolve: async (_, args, context) => {
        if (!context.currentUser) {
          throw new Error("Not authenticated");
        }

        // Only directors and region leaders can create groups
        if (context.currentUser.role === "DIRECTOR") {
          return context.prisma.group.create({
            data: args,
          });
        }
        // Region leaders can create groups only in their own region
        if (context.currentUser.role === "REGION_LEADER") {
          const profile = await context.prisma.regionLeaderProfile.findUnique({
            where: { userId: context.currentUser.id },
          });

          // Verify the region leader is trying to create a group in their own region
          if (!profile || profile.regionId !== args.regionId) {
            throw new Error("Can only create groups in your own region");
          }

          return context.prisma.group.create({
            data: args,
          });
        }

        throw new Error("Not authorized to create groups");
      },
    });
  },
});

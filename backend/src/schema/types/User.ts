/**
 * PURPOSE: User-related GraphQL types and resolvers
 * - Defines User type with role-based data access
 * - Handles user authentication and authorization
 * - Provides queries for getting current user and user lists
 */

import { objectType, enumType, extendType, nonNull, stringArg } from "nexus";

// GraphQL enum that matches the Prisma Role enum
export const Role = enumType({
  name: "Role",
  members: ["DIRECTOR", "REGION_LEADER", "GROUP_LEADER", "GROUP_MEMBER"],
});

// Main User GraphQL type
export const User = objectType({
  name: "User",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("email");
    t.nonNull.string("name");
    t.nonNull.field("role", { type: "Role" });
    t.nonNull.field("createdAt", { type: "DateTime" });
    t.nonNull.field("updatedAt", { type: "DateTime" });

    t.list.field("evangelismContacts", {
      type: "EvangelismContact",
      resolve: (parent, _, context) => {
        return context.prisma.evangelismContact.findMany({
          where: { createdById: parent.id },
        });
      },
    });

    t.list.field("studentRecords", {
      type: "StudentRecord",
      resolve: (parent, _, context) => {
        return context.prisma.studentRecord.findMany({
          where: { trackerId: parent.id },
        });
      },
    });
  },
});

// User-related queries
export const UserQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("me", {
      type: "User",
      resolve: (_, __, context) => {
        if (!context.currentUser) {
          throw new Error("Not authenticated");
        }
        return context.currentUser;
      },
    });

    t.list.field("users", {
      type: "User",
      resolve: async (_, __, context) => {
        if (!context.currentUser) {
          throw new Error("Not authenticated");
        }

        if (context.currentUser.role !== "DIRECTOR") {
          throw new Error("Not authorized");
        }

        return context.prisma.user.findMany();
      },
    });
  },
});

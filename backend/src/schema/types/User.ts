/**
 * PURPOSE: User-related GraphQL types and resolvers
 * - Defines User type with role-based data access
 * - Handles user authentication and authorization
 * - Provides queries for getting current user and user lists
 */
import {
  objectType,
  enumType,
  extendType,
  nonNull,
  stringArg,
  arg,
} from "nexus";

// GraphQL enum that matches the Prisma Role enum
// Defines the four-tier hierarchy of church organization
export const Role = enumType({
  name: "Role",
  members: ["DIRECTOR", "REGION_LEADER", "GROUP_LEADER", "GROUP_MEMBER"],
});

// Main User GraphQL type
// Exposes user information and their associated data based on permissions
export const User = objectType({
  name: "User",
  definition(t) {
    // Basic user fields that everyone can see
    t.nonNull.string("id");
    t.nonNull.string("email");
    t.nonNull.string("name");
    t.nonNull.field("role", { type: "Role" });
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");

    // Evangelism contacts created by this user
    // Only shows contacts the requesting user has permission to see
    t.list.field("evangelismContacts", {
      type: "EvangelismContact",
      resolve: (parent, _, context) => {
        return context.prisma.evangelismContact.findMany({
          where: { createdById: parent.id },
        });
      },
    });

    // Student records tracked by this user
    // Only shows students the requesting user has permission to see
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
    // Get information about the currently logged-in user
    t.field("me", {
      type: "User",
      resolve: (_, __, context) => {
        if (!context.currentUser) {
          throw new Error("Not authenticated");
        }
        return context.currentUser;
      },
    });

    // Get list of all users (admin function)
    // Only directors can see all users for management purposes
    t.list.field("users", {
      type: "User",
      resolve: async (_, __, context) => {
        if (!context.currentUser) {
          throw new Error("Not authenticated");
        }

        // Role-based authorization: only directors can see all users
        if (context.currentUser.role !== "DIRECTOR") {
          throw new Error("Not authorized");
        }

        return context.prisma.user.findMany();
      },
    });
  },
});

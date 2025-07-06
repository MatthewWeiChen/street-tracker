/**
 * PURPOSE: GraphQL context setup for authentication and database access
 * - Provides Prisma database client to all resolvers
 * - Handles user authentication from JWT tokens
 * - Makes current user available throughout the GraphQL schema
 * - Sets up the foundation for role-based authorization
 */

import { PrismaClient } from "@prisma/client";

// Initialize Prisma client for database operations
// This will be shared across all GraphQL resolvers
const prisma = new PrismaClient();

// Context interface that will be available in all GraphQL resolvers
// Provides access to database and current authenticated user
export interface Context {
  prisma: PrismaClient; // Database client for all operations
  currentUser?: any; // Currently authenticated user (if any)
}

// Function to create the GraphQL context for each request
// Called by Apollo Server for every GraphQL operation
export const createContext = async ({ req }: any): Promise<Context> => {
  // Extract user ID from Authorization header
  // In a real app, you'd validate JWT tokens here
  // For now, we'll use a simple header-based auth for development
  const userId = req.headers.authorization?.replace("Bearer ", "");

  let currentUser = null;
  if (userId) {
    try {
      // Fetch the current user with all their profile relationships
      // This gives us access to their role and organizational position
      currentUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          // Include all possible profile types
          directorProfile: true,
          regionLeaderProfile: { include: { region: true } }, // Include region info
          groupLeaderProfile: { include: { group: true } }, // Include group info
          groupMemberProfile: { include: { group: true } }, // Include group info
        },
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      // Don't throw here - just continue without authenticated user
      // This allows for graceful handling of invalid tokens
    }
  }

  // Return context object that will be passed to all resolvers
  return {
    prisma, // Database client
    currentUser, // Authenticated user (null if not authenticated)
  };
};

/**
 * PURPOSE: Main GraphQL schema configuration
 * - Combines all GraphQL types and resolvers into a single schema
 * - Sets up code generation for type safety
 * - Configures the GraphQL context (authentication, database access)
 */
import { makeSchema } from "nexus";
import { join } from "path";
import * as types from "./types";

// GraphQL schema builder using Nexus
// Automatically generates TypeScript types for resolvers and schema
export const schema = makeSchema({
  types, // Import all GraphQL types and resolvers
  outputs: {
    // Generate GraphQL schema file for frontend tools
    schema: join(process.cwd(), "schema.graphql"),
    // Generate TypeScript types for type-safe resolvers
    typegen: join(process.cwd(), "nexus-typegen.ts"),
  },
  contextType: {
    // Link to our custom context type for authentication and database
    module: join(process.cwd(), "./src/context.ts"),
    export: "Context",
  },
  sourceTypes: {
    modules: [
      {
        // Use Prisma client types in our GraphQL resolvers
        module: "@prisma/client",
        alias: "prisma",
      },
    ],
  },
});

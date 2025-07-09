/**
 * PURPOSE: Main GraphQL schema configuration
 * - Combines all GraphQL types and resolvers into a single schema
 * - Sets up code generation for type safety
 * - Configures the GraphQL context (authentication, database access)
 */

import { makeSchema } from "nexus";
import { join } from "path";
import * as types from "./types";
import { DateTimeResolver } from "graphql-scalars";

export const schema = makeSchema({
  types: [types, DateTimeResolver],
  outputs: {
    schema: join(process.cwd(), "schema.graphql"),
    typegen: join(process.cwd(), "nexus-typegen.ts"),
  },
  contextType: {
    module: join(process.cwd(), "./src/context.ts"),
    export: "Context",
  },
  sourceTypes: {
    modules: [
      {
        module: "@prisma/client",
        alias: "prisma",
      },
    ],
  },
});

/**
 * PURPOSE: Express server setup with Apollo GraphQL integration
 * - Sets up the Express.js web server
 * - Configures Apollo Server for GraphQL API
 * - Handles CORS and other middleware
 * - Starts the server and listens for requests
 */

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import cors from "cors";
import { schema } from "./schema";
import { createContext } from "./context";

// Main function to start the GraphQL server with Apollo Server v4
async function startServer() {
  // Create Express app for handling HTTP requests
  const app = express();

  // Create Apollo Server with our GraphQL schema
  const server = new ApolloServer({
    schema, // Our complete GraphQL schema
    introspection: true, // Allow GraphQL introspection (useful for development)
    // Apollo Server v4 uses Apollo Studio instead of GraphQL Playground
  });

  // Start the Apollo Server
  await server.start();

  // Apply the Apollo GraphQL middleware to Express
  app.use(
    "/graphql",
    cors({
      origin: ["http://localhost:3000"], // Allow frontend to access GraphQL
      credentials: true,
    }),
    express.json(), // Parse JSON bodies
    expressMiddleware(server, {
      context: async ({ req }) => createContext({ req }), // Updated context creation
    })
  );

  // Get port from environment variable or default to 4000
  const PORT = process.env.PORT || 4000;

  // Start the HTTP server
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(
      `📊 Apollo Studio available at https://studio.apollographql.com/`
    );
    console.log(`🔍 Connect to: http://localhost:${PORT}/graphql`);
  });
}

// Start the server and handle any startup errors
startServer().catch((error) => {
  console.error("Error starting server:", error);
  process.exit(1); // Exit with error code if server fails to start
});

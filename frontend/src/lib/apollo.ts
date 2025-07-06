/**
 * PURPOSE: Apollo Client configuration for GraphQL communication
 * - Sets up the GraphQL client to communicate with backend
 * - Handles authentication by adding JWT tokens to requests
 * - Configures caching for better performance
 * - Provides the foundation for all frontend GraphQL operations
 */

import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// Create HTTP link to connect to our GraphQL backend
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
});

// Authentication link to add JWT tokens to all requests
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage if it exists
  // In a production app, you'd want to use more secure token storage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      // Add authorization header with JWT token if available
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Create Apollo Client instance with authentication and caching
export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink), // Chain auth link with HTTP link
  cache: new InMemoryCache(), // Enable caching for better performance
});

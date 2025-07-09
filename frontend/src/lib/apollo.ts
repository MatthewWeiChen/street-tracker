import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
});

const authLink = setContext((_, { headers }) => {
  // For testing, use a hardcoded user ID (replace with the Director ID from seed output)
  const testUserId = "cmcvicese0003sivcifz68ked";

  return {
    headers: {
      ...headers,
      authorization: testUserId ? `Bearer ${testUserId}` : "",
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

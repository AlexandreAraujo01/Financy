import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { authStorage } from './auth-storage';

const httpLink = new HttpLink({ uri: import.meta.env.VITE_API_URL ?? '/graphql' });

// Manda o token do login em toda operação; o backend tira o usuário dele.
const authLink = new SetContextLink((prevContext) => {
  const token = authStorage.get();
  return token
    ? { headers: { ...prevContext.headers, authorization: `Bearer ${token}` } }
    : {};
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache(),
});

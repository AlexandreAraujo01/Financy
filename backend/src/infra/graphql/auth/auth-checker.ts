import type { AuthChecker } from 'type-graphql';
import type { GraphQLContext } from './context';

// Usado pelo @Authorized(): só deixa passar quem mandou um token válido.
export const authChecker: AuthChecker<GraphQLContext> = ({ context }) => context.userId !== null;

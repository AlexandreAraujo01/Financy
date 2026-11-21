import { AuthenticationError, createParameterDecorator } from 'type-graphql';
import type { GraphQLContext } from './context';

// Injeta no resolver o id do usuário logado, vindo do token e nunca do input.
export function CurrentUserId() {
  return createParameterDecorator<GraphQLContext>(({ context }) => {
    if (!context.userId) throw new AuthenticationError();
    return context.userId;
  });
}

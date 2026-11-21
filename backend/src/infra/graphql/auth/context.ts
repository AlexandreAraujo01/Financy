import type { FastifyRequest } from 'fastify';
import { TokenSigner } from '@/ports/token-signer';

export interface GraphQLContext {
  // null quando a requisição não tem token ou o token é inválido/expirado.
  userId: string | null;
}

export function makeContext(tokens: TokenSigner) {
  return async (request: FastifyRequest): Promise<GraphQLContext> => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) return { userId: null };

    try {
      const { sub } = await tokens.verify(header.slice('Bearer '.length));
      return { userId: sub };
    } catch {
      // Token inválido não derruba a requisição: as operações públicas (register, login)
      // continuam funcionando e as protegidas respondem UNAUTHENTICATED.
      return { userId: null };
    }
  };
}

import { CombinedGraphQLErrors } from '@apollo/client/errors';

// Código que o backend coloca em extensions.code (CONFLICT, UNAUTHENTICATED, ...).
export function errorCode(error: unknown): string | undefined {
  if (!CombinedGraphQLErrors.is(error)) return undefined;
  const code = error.errors[0]?.extensions?.['code'];
  return typeof code === 'string' ? code : undefined;
}

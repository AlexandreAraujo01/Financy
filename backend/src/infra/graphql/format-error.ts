import type { GraphQLFormattedError } from 'graphql';
import { unwrapResolverError } from '@apollo/server/errors';
import { CategoryAlreadyExistsError } from '@/domain/errors/category-already-exists-error';
import { CategoryNotFoundError } from '@/domain/errors/category-not-found-error';
import { InvalidCredentialsError } from '@/domain/errors/invalid-credentials-error';
import { InvalidInputError } from '@/domain/errors/invalid-input-error';
import { RecurringTransactionNotFoundError } from '@/domain/errors/recurring-transaction-not-found-error';
import { TransactionNotFoundError } from '@/domain/errors/transaction-not-found-error';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists-error';
import { UserNotFoundError } from '@/domain/errors/user-not-found-error';

// Traduz os erros de domínio para códigos que o front consegue tratar.
export function formatError(
  formatted: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const original = unwrapResolverError(error);
  const extensions = { ...formatted.extensions };
  delete extensions.stacktrace;

  if (original instanceof InvalidInputError) {
    return { ...formatted, extensions: { ...extensions, code: 'BAD_USER_INPUT', issues: original.issues } };
  }
  if (original instanceof InvalidCredentialsError) {
    return { ...formatted, extensions: { ...extensions, code: 'UNAUTHENTICATED' } };
  }
  if (original instanceof UserAlreadyExistsError || original instanceof CategoryAlreadyExistsError) {
    return { ...formatted, extensions: { ...extensions, code: 'CONFLICT' } };
  }
  if (original instanceof UserNotFoundError ||
    original instanceof CategoryNotFoundError ||
    original instanceof TransactionNotFoundError ||
    original instanceof RecurringTransactionNotFoundError) {
    return { ...formatted, extensions: { ...extensions, code: 'NOT_FOUND' } };
  }

  return { ...formatted, extensions };
}

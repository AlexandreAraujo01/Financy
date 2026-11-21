import { z } from 'zod';
import { TRANSACTION_TYPES } from '@/domain/entities/props/transaction/transaction';

export const transactionId = z.uuid();
export const transactionType = z.enum(TRANSACTION_TYPES);
// Aceita Date ou string ISO (o que chega do GraphQL).
export const transactionDate = z.coerce.date();
// Em centavos; o teto é o limite da coluna integer do Postgres.
export const transactionValueInCents = z.number().int().positive().max(2_147_483_647);

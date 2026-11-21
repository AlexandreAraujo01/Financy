import { describe, expect, it } from 'vitest';
import { CATEGORY_STATUSES } from '@/domain/entities/props/category/category';
import {
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
} from '@/domain/entities/props/transaction/transaction';
import { CategoryStatus, TransactionStatus, TransactionType } from '../generated/enums';

// O schema.prisma não importa código TS, então este teste garante que os enums
// do banco continuam iguais aos do domínio.
describe('Prisma enums', () => {
  it.each([
    ['CategoryStatus', CategoryStatus, CATEGORY_STATUSES],
    ['TransactionType', TransactionType, TRANSACTION_TYPES],
    ['TransactionStatus', TransactionStatus, TRANSACTION_STATUSES],
  ])('%s should match the domain values', (_, prismaEnum, domainValues) => {
    expect(Object.values(prismaEnum).sort()).toEqual([...domainValues].sort());
  });
});

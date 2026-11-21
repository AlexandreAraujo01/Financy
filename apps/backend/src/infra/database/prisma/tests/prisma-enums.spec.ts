import { describe, expect, it } from 'vitest';
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_STATUSES,
} from '@/domain/entities/props/category/category';
import {
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
} from '@/domain/entities/props/transaction/transaction';
import { RECURRING_DAY_TYPES, RECURRING_TRANSACTION_STATUSES } from '@/domain/entities/props/recurring-transaction/recurring-transaction';
import {
  CategoryColor,
  CategoryIcon,
  CategoryStatus,
  RecurringTransactionStatus,
  RecurringDayType,
  TransactionStatus,
  TransactionType,
} from '../generated/enums';

// O schema.prisma não importa código TS, então este teste garante que os enums
// do banco continuam iguais aos do domínio.
describe('Prisma enums', () => {
  it.each([
    ['CategoryStatus', CategoryStatus, CATEGORY_STATUSES],
    ['CategoryIcon', CategoryIcon, CATEGORY_ICONS],
    ['CategoryColor', CategoryColor, CATEGORY_COLORS],
    ['TransactionType', TransactionType, TRANSACTION_TYPES],
    ['TransactionStatus', TransactionStatus, TRANSACTION_STATUSES],
    ['RecurringTransactionStatus', RecurringTransactionStatus, RECURRING_TRANSACTION_STATUSES],
    ['RecurringDayType', RecurringDayType, RECURRING_DAY_TYPES],
  ])('%s should match the domain values', (_, prismaEnum, domainValues) => {
    expect(Object.values(prismaEnum).sort()).toEqual([...domainValues].sort());
  });
});

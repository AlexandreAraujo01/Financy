import type { TransactionType } from '../transaction/transaction';

export const RECURRING_TRANSACTION_STATUSES = ['active', 'ended'] as const;

export type RecurringTransactionStatus = (typeof RECURRING_TRANSACTION_STATUSES)[number];

export const RECURRING_DAY_TYPES = ['calendar_day', 'business_day'] as const;
export type RecurringDayType = (typeof RECURRING_DAY_TYPES)[number];

export interface IRecurringTransaction {
  userId: string;
  categoryId: string;
  description: string;
  type: TransactionType;
  // Em centavos (R$ 150,50 = 15050).
  valueInCents: number;
  // Dia corrido (1 a 31) ou posição do dia útil no mês (1 a 23).
  dayOfMonth: number;
  dayType: RecurringDayType;
  startDate: Date;
  // Próxima data ainda não gerada; avança a cada mês gerado.
  nextDueDate: Date;
  status: RecurringTransactionStatus;
}

export const TRANSACTION_TYPES = ['income', 'expense'] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_STATUSES = ['active', 'deleted'] as const;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export interface ITransaction {
  userId: string;
  categoryId: string;
  type: TransactionType;
  date: Date;
  // Em centavos (R$ 150,50 = 15050).
  valueInCents: number;
  status: TransactionStatus;
}

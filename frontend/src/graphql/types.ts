// Espelha os tipos do schema GraphQL do backend (backend/schema.graphql).

export type CategoryIcon =
  | 'briefcase_business'
  | 'car_front'
  | 'heart_pulse'
  | 'piggy_bank'
  | 'shopping_cart'
  | 'ticket'
  | 'tool_case'
  | 'utensils'
  | 'paw_print'
  | 'house'
  | 'gift'
  | 'dumbbell'
  | 'book_open'
  | 'baggage_claim'
  | 'mailbox'
  | 'receipt_text';

export type CategoryColor = 'green' | 'blue' | 'purple' | 'pink' | 'red' | 'orange' | 'yellow';

export type TransactionType = 'income' | 'expense';
export type RecurringDayType = 'calendar_day' | 'business_day';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: CategoryIcon;
  color: CategoryColor;
  createdAt: string;
}

export interface Transaction {
  id: string;
  categoryId: string;
  description: string;
  type: TransactionType;
  date: string;
  // Em centavos (R$ 150,50 = 15050).
  valueInCents: number;
  // Recorrência que gerou a transação; null quando foi lançada à mão.
  recurringTransactionId: string | null;
  createdAt: string;
}

// Salário, assinatura... gera uma transação por mês, em dia fixo ou dia útil.
export interface RecurringTransaction {
  id: string;
  categoryId: string;
  description: string;
  type: TransactionType;
  valueInCents: number;
  dayOfMonth: number;
  dayType: RecurringDayType;
  startDate: string;
  nextDueDate: string;
  createdAt: string;
}

export interface RecurringTransactionInput {
  categoryId: string;
  description: string;
  type: TransactionType;
  valueInCents: number;
  dayOfMonth: number;
  dayType?: RecurringDayType;
}

export interface CategoryInput {
  name: string;
  description: string | null;
  icon: CategoryIcon;
  color: CategoryColor;
}

export interface TransactionInput {
  categoryId: string;
  description: string;
  type: TransactionType;
  date: string;
  valueInCents: number;
}

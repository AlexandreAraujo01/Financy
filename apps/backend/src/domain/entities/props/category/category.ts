export const CATEGORY_STATUSES = ['active', 'deleted'] as const;

export type CategoryStatus = (typeof CATEGORY_STATUSES)[number];

// Ícones do Lucide oferecidos no design (com _ no lugar de -, que enum do Postgres/Prisma não aceita).
export const CATEGORY_ICONS = [
  'briefcase_business',
  'car_front',
  'heart_pulse',
  'piggy_bank',
  'shopping_cart',
  'ticket',
  'tool_case',
  'utensils',
  'paw_print',
  'house',
  'gift',
  'dumbbell',
  'book_open',
  'baggage_claim',
  'mailbox',
  'receipt_text',
] as const;

export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

export const CATEGORY_COLORS = ['green', 'blue', 'purple', 'pink', 'red', 'orange', 'yellow'] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export interface ICategory {
  userId: string;
  name: string;
  description: string | null;
  icon: CategoryIcon;
  color: CategoryColor;
  status: CategoryStatus;
}

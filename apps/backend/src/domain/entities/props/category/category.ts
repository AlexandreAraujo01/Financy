export const CATEGORY_STATUSES = ['active', 'deleted'] as const;

export type CategoryStatus = (typeof CATEGORY_STATUSES)[number];

export interface ICategory {
  userId: string;
  name: string;
  status: CategoryStatus;
}

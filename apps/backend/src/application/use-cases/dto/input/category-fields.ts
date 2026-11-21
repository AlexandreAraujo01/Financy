import { z } from 'zod';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/domain/entities/props/category/category';

export const categoryId = z.uuid();
export const categoryName = z.string().trim().min(1).max(50);
// Opcional: ausente, null ou vazio viram "sem descrição".
export const categoryDescription = z
  .string()
  .trim()
  .max(200)
  .nullish()
  .transform((description) => description || null);
export const categoryIcon = z.enum(CATEGORY_ICONS);
export const categoryColor = z.enum(CATEGORY_COLORS);

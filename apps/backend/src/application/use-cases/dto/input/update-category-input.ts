import { z } from 'zod';
import {
  categoryColor,
  categoryDescription,
  categoryIcon,
  categoryId,
  categoryName,
} from './category-fields';
import { userId } from './user-fields';

// Substitui a categoria inteira: é o que o formulário de edição manda.
export const updateCategoryInputSchema = z.object({
  userId,
  categoryId,
  name: categoryName,
  description: categoryDescription,
  icon: categoryIcon,
  color: categoryColor,
});

export type UpdateCategoryInput = z.input<typeof updateCategoryInputSchema>;

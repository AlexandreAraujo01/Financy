import { Category } from '@/domain/entities/category';
import { CategoryNotFoundError } from '@/domain/errors/category-not-found-error';
import { CategoryRepository } from '@/ports/category-repository';

// Uma transação só pode usar categoria ativa do próprio usuário. Categoria de outro
// usuário responde como inexistente, pra não revelar que ela existe.
export async function findOwnedCategory(
  categories: CategoryRepository,
  userId: string,
  categoryId: string,
): Promise<Category> {
  const category = await categories.find(categoryId);
  if (!category?.isActive || category.toSnapshot().userId !== userId) {
    throw new CategoryNotFoundError(categoryId);
  }
  return category;
}

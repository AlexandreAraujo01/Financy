import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import { DeleteCategoryInput, deleteCategoryInputSchema } from './dto/input/delete-category-input';
import { Category } from '@/domain/entities/category';
import { CategoryNotFoundError } from '@/domain/errors/category-not-found-error';
import { CategoryRepository } from '@/ports/category-repository';

export class DeleteCategoryUseCase extends UseCase<DeleteCategoryInput, Category> {
  constructor(private readonly categories: CategoryRepository) {
    super();
  }

  async execute(input: DeleteCategoryInput): Promise<Category> {
    const { userId, categoryId } = validate(deleteCategoryInputSchema, input);

    const category = await this.categories.find(categoryId);
    if (!category?.isActive || category.toSnapshot().userId !== userId) {
      throw new CategoryNotFoundError(categoryId);
    }

    // Só marca como excluída: as transações antigas continuam apontando pra ela.
    const deleted = await this.categories.update({ status: 'deleted' }, categoryId);
    if (!deleted) {
      throw new CategoryNotFoundError(categoryId);
    }

    return deleted;
  }
}

import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import { UpdateCategoryInput, updateCategoryInputSchema } from './dto/input/update-category-input';
import { Category } from '@/domain/entities/category';
import { CategoryAlreadyExistsError } from '@/domain/errors/category-already-exists-error';
import { CategoryNotFoundError } from '@/domain/errors/category-not-found-error';
import { CategoryRepository } from '@/ports/category-repository';

export class UpdateCategoryUseCase extends UseCase<UpdateCategoryInput, Category> {
  constructor(private readonly categories: CategoryRepository) {
    super();
  }

  async execute(input: UpdateCategoryInput): Promise<Category> {
    const { userId, categoryId, name, ...fields } = validate(updateCategoryInputSchema, input);

    const category = await this.categories.find(categoryId);
    // Categoria de outro usuário responde como inexistente, pra não revelar que existe.
    if (!category?.isActive || category.toSnapshot().userId !== userId) {
      throw new CategoryNotFoundError(categoryId);
    }

    const owner = await this.categories.findActiveByName(userId, name);
    if (owner && owner.id !== categoryId) {
      throw new CategoryAlreadyExistsError(name);
    }

    const updated = await this.categories.update({ name, ...fields }, categoryId);
    if (!updated) {
      throw new CategoryNotFoundError(categoryId);
    }

    return updated;
  }
}

import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import { CreateCategoryInput, createCategoryInputSchema } from './dto/input/create-category-input';
import { Category } from '@/domain/entities/category';
import { CategoryAlreadyExistsError } from '@/domain/errors/category-already-exists-error';
import { CategoryRepository } from '@/ports/category-repository';

export class CreateCategoryUseCase extends UseCase<CreateCategoryInput, Category> {
  constructor(private readonly categories: CategoryRepository) {
    super();
  }

  async execute(input: CreateCategoryInput): Promise<Category> {
    const { userId, name } = validate(createCategoryInputSchema, input);

    if (await this.categories.findActiveByName(userId, name)) {
      throw new CategoryAlreadyExistsError(name);
    }

    return this.categories.create(Category.create({ userId, name, status: 'active' }));
  }
}

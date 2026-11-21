import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import { ListCategoriesInput, listCategoriesInputSchema } from './dto/input/list-categories-input';
import { Category } from '@/domain/entities/category';
import { CategoryRepository } from '@/ports/category-repository';

export class ListCategoriesUseCase extends UseCase<ListCategoriesInput, Category[]> {
  constructor(private readonly categories: CategoryRepository) {
    super();
  }

  async execute(input: ListCategoriesInput): Promise<Category[]> {
    const { userId } = validate(listCategoriesInputSchema, input);
    return this.categories.findManyActiveByUser(userId);
  }
}

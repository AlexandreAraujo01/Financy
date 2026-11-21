import { Category } from '@/domain/entities/category';
import { ICategory } from '@/domain/entities/props/category/category';
import { CategoryRepository } from '@/ports/category-repository';
import { InMemoryRepository } from './in-memory-repository';

export class InMemoryCategoryRepository
  extends InMemoryRepository<Category, ICategory>
  implements CategoryRepository
{
  findActiveByName(userId: string, name: string): Promise<Category | null> {
    const category = [...this.items.values()].find((category) => {
      const snapshot = category.toSnapshot();
      return (
        category.isActive &&
        snapshot.userId === userId &&
        snapshot.name.toLowerCase() === name.toLowerCase()
      );
    });
    return Promise.resolve(category ?? null);
  }

  findManyActiveByUser(userId: string): Promise<Category[]> {
    const categories = [...this.items.values()]
      .filter((category) => category.isActive && category.toSnapshot().userId === userId)
      .sort((a, b) => a.toSnapshot().name.localeCompare(b.toSnapshot().name));
    return Promise.resolve(categories);
  }

  protected build(props: ICategory, id: string, createdAt: Date): Category {
    return Category.create(props, id, createdAt);
  }
}

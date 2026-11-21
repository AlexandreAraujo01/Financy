import { Category } from '@/domain/entities/category';
import { ICategory } from '@/domain/entities/props/category/category';
import { Repository } from './repository';

export abstract class CategoryRepository extends Repository<Category, ICategory> {
  // Compara o nome sem diferenciar maiúsculas e ignora as categorias excluídas.
  abstract findActiveByName(userId: string, name: string): Promise<Category | null>;

  // Categorias ativas do usuário, em ordem alfabética.
  abstract findManyActiveByUser(userId: string): Promise<Category[]>;
}

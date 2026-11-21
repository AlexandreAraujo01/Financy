import { Category } from '@/domain/entities/category';
import { ICategory } from '@/domain/entities/props/category/category';
import { CategoryRepository } from '@/ports/category-repository';
import type { Category as CategoryRow, PrismaClient } from '../generated/client';
import { isRecordNotFound } from '../prisma';

export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(category: Category): Promise<Category> {
    await this.prisma.category.create({ data: category.toSnapshot() });
    return category;
  }

  async find(id: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findActiveByName(userId: string, name: string): Promise<Category | null> {
    // SQL direto porque o `mode: 'insensitive'` do Prisma vira ILIKE sem escapar
    // curingas: "a_b" acharia "axb". lower() = lower() compara o texto exato.
    const [match] = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM categories
      WHERE user_id = ${userId}::uuid
        AND status = 'active'
        AND lower(name) = lower(${name})
      LIMIT 1`;
    return match ? this.find(match.id) : null;
  }

  async findManyActiveByUser(userId: string): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      where: { userId, status: 'active' },
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async delete(id: string): Promise<Category | null> {
    try {
      return this.toDomain(await this.prisma.category.delete({ where: { id } }));
    } catch (error) {
      if (isRecordNotFound(error)) return null;
      throw error;
    }
  }

  async update(data: Partial<ICategory>, id: string): Promise<Category | null> {
    try {
      return this.toDomain(await this.prisma.category.update({ where: { id }, data }));
    } catch (error) {
      if (isRecordNotFound(error)) return null;
      throw error;
    }
  }

  private toDomain({ id, createdAt, ...props }: CategoryRow): Category {
    return Category.create(props, id, createdAt);
  }
}

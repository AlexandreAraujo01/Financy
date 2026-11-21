import { beforeEach, describe, expect, it } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category-repository';
import { Category } from '@/domain/entities/category';
import { InvalidInputError } from '@/domain/errors/invalid-input-error';
import { ListCategoriesUseCase } from '../list-categories-use-case';

const userA = uuidv7();
const userB = uuidv7();

let categoryRepo: InMemoryCategoryRepository;
let sut: ListCategoriesUseCase;

const createCategory = (userId: string, name: string, status: 'active' | 'deleted' = 'active') =>
  categoryRepo.create(Category.create({ userId, name, status }));

beforeEach(() => {
  categoryRepo = new InMemoryCategoryRepository();
  sut = new ListCategoriesUseCase(categoryRepo);
});

describe('ListCategoriesUseCase unit test', () => {
  it("should list only the user's active categories in alphabetical order", async () => {
    await createCategory(userA, 'Mercado');
    await createCategory(userA, 'Lazer');
    await createCategory(userA, 'Antiga', 'deleted');
    await createCategory(userB, 'Contas');

    const categories = await sut.execute({ userId: userA });

    expect(categories.map((c) => c.toSnapshot().name)).toEqual(['Lazer', 'Mercado']);
  });

  it('should return an empty list for a user without categories', async () => {
    await expect(sut.execute({ userId: userA })).resolves.toEqual([]);
  });

  it('should throw InvalidInputError for a user id that is not a uuid', async () => {
    await expect(sut.execute({ userId: '123' })).rejects.toBeInstanceOf(InvalidInputError);
  });
});

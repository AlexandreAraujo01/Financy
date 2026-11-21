import { beforeEach, describe, expect, it } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category-repository';
import { Category } from '@/domain/entities/category';
import { CategoryNotFoundError } from '@/domain/errors/category-not-found-error';
import { InvalidInputError } from '@/domain/errors/invalid-input-error';
import { DeleteCategoryUseCase } from '../delete-category-use-case';

const userId = uuidv7();

let categoryRepo: InMemoryCategoryRepository;
let category: Category;
let sut: DeleteCategoryUseCase;

beforeEach(async () => {
  categoryRepo = new InMemoryCategoryRepository();
  category = await categoryRepo.create(
    Category.create({ description: null, icon: 'utensils', color: 'blue', userId, name: 'Mercado', status: 'active' }),
  );
  sut = new DeleteCategoryUseCase(categoryRepo);
});

describe('DeleteCategoryUseCase unit test', () => {
  it('should mark the category as deleted without removing it', async () => {
    const deleted = await sut.execute({ userId, categoryId: category.id });

    expect(deleted.isActive).toBe(false);
    expect(categoryRepo.items.get(category.id)?.toSnapshot().status).toBe('deleted');
  });

  it('should throw CategoryNotFoundError when deleting twice', async () => {
    await sut.execute({ userId, categoryId: category.id });

    await expect(sut.execute({ userId, categoryId: category.id })).rejects.toBeInstanceOf(
      CategoryNotFoundError,
    );
  });

  it('should throw CategoryNotFoundError for a category of another user', async () => {
    await expect(
      sut.execute({ userId: uuidv7(), categoryId: category.id }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
    expect(categoryRepo.items.get(category.id)?.isActive).toBe(true);
  });

  it('should throw CategoryNotFoundError for an unknown id', async () => {
    await expect(sut.execute({ userId, categoryId: uuidv7() })).rejects.toBeInstanceOf(
      CategoryNotFoundError,
    );
  });

  it('should throw InvalidInputError for an id that is not a uuid', async () => {
    await expect(sut.execute({ userId, categoryId: '123' })).rejects.toBeInstanceOf(
      InvalidInputError,
    );
  });
});

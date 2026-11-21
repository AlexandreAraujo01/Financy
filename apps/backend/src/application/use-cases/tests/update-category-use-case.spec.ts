import { beforeEach, describe, expect, it } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category-repository';
import { Category } from '@/domain/entities/category';
import { CategoryAlreadyExistsError } from '@/domain/errors/category-already-exists-error';
import { CategoryNotFoundError } from '@/domain/errors/category-not-found-error';
import { InvalidInputError } from '@/domain/errors/invalid-input-error';
import { UpdateCategoryUseCase } from '../update-category-use-case';

const userId = uuidv7();

let categoryRepo: InMemoryCategoryRepository;
let category: Category;
let sut: UpdateCategoryUseCase;

const createCategory = (name: string, owner = userId) =>
  categoryRepo.create(Category.create({ userId: owner, name, status: 'active' }));

beforeEach(async () => {
  categoryRepo = new InMemoryCategoryRepository();
  category = await createCategory('Mercado');
  sut = new UpdateCategoryUseCase(categoryRepo);
});

describe('UpdateCategoryUseCase unit test', () => {
  it('should rename the category', async () => {
    const updated = await sut.execute({ userId, categoryId: category.id, name: ' Supermercado ' });

    expect(updated.toSnapshot()).toMatchObject({
      id: category.id,
      userId,
      name: 'Supermercado',
      status: 'active',
    });
  });

  it('should allow changing only the case of its own name', async () => {
    const updated = await sut.execute({ userId, categoryId: category.id, name: 'MERCADO' });

    expect(updated.toSnapshot().name).toBe('MERCADO');
  });

  it('should throw CategoryAlreadyExistsError for a name used by another category of the user', async () => {
    await createCategory('Lazer');

    await expect(
      sut.execute({ userId, categoryId: category.id, name: 'lazer' }),
    ).rejects.toBeInstanceOf(CategoryAlreadyExistsError);
  });

  it('should throw CategoryNotFoundError for a category of another user', async () => {
    await expect(
      sut.execute({ userId: uuidv7(), categoryId: category.id, name: 'Lazer' }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
    expect(categoryRepo.items.get(category.id)?.toSnapshot().name).toBe('Mercado');
  });

  it('should throw CategoryNotFoundError for a deleted category', async () => {
    await categoryRepo.update({ status: 'deleted' }, category.id);

    await expect(
      sut.execute({ userId, categoryId: category.id, name: 'Lazer' }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it('should throw CategoryNotFoundError for an unknown id', async () => {
    await expect(
      sut.execute({ userId, categoryId: uuidv7(), name: 'Lazer' }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it('should throw InvalidInputError for an empty name', async () => {
    await expect(
      sut.execute({ userId, categoryId: category.id, name: '' }),
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});

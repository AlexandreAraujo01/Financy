import { beforeEach, describe, expect, it } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category-repository';
import { Category } from '@/domain/entities/category';
import { CategoryAlreadyExistsError } from '@/domain/errors/category-already-exists-error';
import { InvalidInputError } from '@/domain/errors/invalid-input-error';
import { CreateCategoryUseCase } from '../create-category-use-case';

const userId = uuidv7();

let categoryRepo: InMemoryCategoryRepository;
let sut: CreateCategoryUseCase;

beforeEach(() => {
  categoryRepo = new InMemoryCategoryRepository();
  sut = new CreateCategoryUseCase(categoryRepo);
});

describe('CreateCategoryUseCase unit test', () => {
  it('should create an active category for the user', async () => {
    const category = await sut.execute({ userId, name: 'Mercado' });

    expect(category.toSnapshot()).toMatchObject({ userId, name: 'Mercado', status: 'active' });
    expect(categoryRepo.items.get(category.id)).toBe(category);
  });

  it('should trim the name', async () => {
    const category = await sut.execute({ userId, name: '  Mercado  ' });

    expect(category.toSnapshot().name).toBe('Mercado');
  });

  it('should throw CategoryAlreadyExistsError for a name the user already has, ignoring case', async () => {
    await sut.execute({ userId, name: 'Mercado' });

    await expect(sut.execute({ userId, name: ' MERCADO ' })).rejects.toBeInstanceOf(
      CategoryAlreadyExistsError,
    );
    expect(categoryRepo.items.size).toBe(1);
  });

  it('should allow the same name for different users', async () => {
    await sut.execute({ userId, name: 'Mercado' });

    await expect(sut.execute({ userId: uuidv7(), name: 'Mercado' })).resolves.toBeInstanceOf(
      Category,
    );
  });

  it('should allow reusing the name of a deleted category', async () => {
    const deleted = await sut.execute({ userId, name: 'Mercado' });
    await categoryRepo.update({ status: 'deleted' }, deleted.id);

    await expect(sut.execute({ userId, name: 'Mercado' })).resolves.toBeInstanceOf(Category);
  });

  it.each([
    ['name', { name: '   ' }],
    ['name', { name: 'a'.repeat(51) }],
    ['userId', { userId: '123' }],
  ])('should throw InvalidInputError for an invalid %s', async (path, override) => {
    const error = await sut.execute({ userId, name: 'Mercado', ...override }).catch((e) => e);

    expect(error).toBeInstanceOf(InvalidInputError);
    expect(error.issues).toEqual([expect.objectContaining({ path })]);
  });
});

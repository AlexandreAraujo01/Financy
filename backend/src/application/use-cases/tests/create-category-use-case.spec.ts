import { beforeEach, describe, expect, it } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category-repository';
import { Category } from '@/domain/entities/category';
import { CategoryAlreadyExistsError } from '@/domain/errors/category-already-exists-error';
import { InvalidInputError } from '@/domain/errors/invalid-input-error';
import { CreateCategoryUseCase } from '../create-category-use-case';

const userId = uuidv7();

// Ícone e cor não importam pra estes testes; os campos novos têm testes próprios.
const look = { icon: 'utensils', color: 'blue' } as const;

let categoryRepo: InMemoryCategoryRepository;
let sut: CreateCategoryUseCase;

beforeEach(() => {
  categoryRepo = new InMemoryCategoryRepository();
  sut = new CreateCategoryUseCase(categoryRepo);
});

describe('CreateCategoryUseCase unit test', () => {
  it('should create an active category for the user', async () => {
    const category = await sut.execute({ userId, ...look, name: 'Mercado' });

    expect(category.toSnapshot()).toMatchObject({ userId, name: 'Mercado', status: 'active' });
    expect(categoryRepo.items.get(category.id)).toBe(category);
  });

  it('should trim the name', async () => {
    const category = await sut.execute({ userId, ...look, name: '  Mercado  ' });

    expect(category.toSnapshot().name).toBe('Mercado');
  });

  it('should throw CategoryAlreadyExistsError for a name the user already has, ignoring case', async () => {
    await sut.execute({ userId, ...look, name: 'Mercado' });

    await expect(sut.execute({ userId, ...look, name: ' MERCADO ' })).rejects.toBeInstanceOf(
      CategoryAlreadyExistsError,
    );
    expect(categoryRepo.items.size).toBe(1);
  });

  it('should allow the same name for different users', async () => {
    await sut.execute({ userId, ...look, name: 'Mercado' });

    await expect(sut.execute({ userId: uuidv7(), ...look, name: 'Mercado' })).resolves.toBeInstanceOf(
      Category,
    );
  });

  it('should allow reusing the name of a deleted category', async () => {
    const deleted = await sut.execute({ userId, ...look, name: 'Mercado' });
    await categoryRepo.update({ status: 'deleted' }, deleted.id);

    await expect(sut.execute({ userId, ...look, name: 'Mercado' })).resolves.toBeInstanceOf(Category);
  });

  it.each([
    ['name', { name: '   ' }],
    ['name', { name: 'a'.repeat(51) }],
    ['userId', { userId: '123' }],
  ])('should throw InvalidInputError for an invalid %s', async (path, override) => {
    const error = await sut.execute({ userId, ...look, name: 'Mercado', ...override }).catch((e) => e);

    expect(error).toBeInstanceOf(InvalidInputError);
    expect(error.issues).toEqual([expect.objectContaining({ path })]);
  });

  it('should save the description, icon and color', async () => {
    const category = await sut.execute({
      userId,
      name: 'Mercado',
      description: '  Compras do mês  ',
      icon: 'shopping_cart',
      color: 'orange',
    });

    expect(category.toSnapshot()).toMatchObject({
      description: 'Compras do mês',
      icon: 'shopping_cart',
      color: 'orange',
    });
  });

  it.each([undefined, null, '   '])('should store a missing description (%s) as null', async (description) => {
    const category = await sut.execute({ userId, ...look, name: 'Mercado', description });

    expect(category.toSnapshot().description).toBeNull();
  });

  it.each([
    ['icon', { icon: 'rocket' }],
    ['color', { color: 'black' }],
    ['description', { description: 'a'.repeat(201) }],
  ])('should throw InvalidInputError for an invalid %s', async (path, override) => {
    const error = await sut
      .execute({ userId, ...look, name: 'Mercado', ...(override as object) })
      .catch((e) => e);

    expect(error).toBeInstanceOf(InvalidInputError);
    expect(error.issues).toEqual([expect.objectContaining({ path })]);
  });
});

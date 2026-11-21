import { beforeEach, describe, expect, it } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category-repository';
import { InMemoryTransactionRepository } from '@test/repositories/in-memory-transaction-repository';
import { Category } from '@/domain/entities/category';
import { CategoryNotFoundError } from '@/domain/errors/category-not-found-error';
import { InvalidInputError } from '@/domain/errors/invalid-input-error';
import { CreateTransactionUseCase } from '../create-transaction-use-case';

const userA = uuidv7();
const userB = uuidv7();

let transactionRepo: InMemoryTransactionRepository;
let categoryRepo: InMemoryCategoryRepository;
let categoryA: Category;
let categoryB: Category;
let sut: CreateTransactionUseCase;

const input = () => ({
  userId: userA,
  categoryId: categoryA.id,
  description: 'Jantar no restaurante',
  type: 'expense' as const,
  date: new Date('2026-11-21T12:00:00.000Z'),
  valueInCents: 15050,
});

beforeEach(async () => {
  transactionRepo = new InMemoryTransactionRepository();
  categoryRepo = new InMemoryCategoryRepository();
  categoryA = await categoryRepo.create(
    Category.create({ description: null, icon: 'utensils', color: 'blue', userId: userA, name: 'Mercado', status: 'active' }),
  );
  categoryB = await categoryRepo.create(
    Category.create({ description: null, icon: 'utensils', color: 'blue', userId: userB, name: 'Mercado', status: 'active' }),
  );
  sut = new CreateTransactionUseCase(transactionRepo, categoryRepo);
});

describe('CreateTransactionUseCase unit test', () => {
  it('should create an active transaction', async () => {
    const transaction = await sut.execute(input());

    expect(transaction.toSnapshot()).toMatchObject({ ...input(), status: 'active' });
    expect(transactionRepo.items.get(transaction.id)).toBe(transaction);
  });

  it('should accept the date as an ISO string', async () => {
    const transaction = await sut.execute({ ...input(), date: '2026-11-21T12:00:00.000Z' });

    expect(transaction.toSnapshot().date).toEqual(new Date('2026-11-21T12:00:00.000Z'));
  });

  it("should throw CategoryNotFoundError when user A uses user B's category", async () => {
    await expect(
      sut.execute({ ...input(), categoryId: categoryB.id }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
    expect(transactionRepo.items.size).toBe(0);
  });

  it('should throw CategoryNotFoundError for a deleted category', async () => {
    await categoryRepo.update({ status: 'deleted' }, categoryA.id);

    await expect(sut.execute(input())).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it('should throw CategoryNotFoundError for an unknown category', async () => {
    await expect(
      sut.execute({ ...input(), categoryId: uuidv7() }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it.each([
    ['valueInCents', { valueInCents: 0 }],
    ['valueInCents', { valueInCents: -100 }],
    ['valueInCents', { valueInCents: 150.5 }],
    ['valueInCents', { valueInCents: 2_147_483_648 }],
    ['type', { type: 'bill' }],
    ['date', { date: 'not-a-date' }],
    ['description', { description: '   ' }],
    ['description', { description: 'a'.repeat(101) }],
  ])('should throw InvalidInputError for an invalid %s', async (path, override) => {
    const error = await sut
      .execute({ ...input(), ...(override as object) })
      .catch((e) => e);

    expect(error).toBeInstanceOf(InvalidInputError);
    expect(error.issues).toEqual([expect.objectContaining({ path })]);
    expect(transactionRepo.items.size).toBe(0);
  });

  it('should trim the description', async () => {
    const transaction = await sut.execute({ ...input(), description: '  Jantar  ' });

    expect(transaction.toSnapshot().description).toBe('Jantar');
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category-repository';
import { InMemoryTransactionRepository } from '@test/repositories/in-memory-transaction-repository';
import { Category } from '@/domain/entities/category';
import { Transaction } from '@/domain/entities/transaction';
import { CategoryNotFoundError } from '@/domain/errors/category-not-found-error';
import { InvalidInputError } from '@/domain/errors/invalid-input-error';
import { TransactionNotFoundError } from '@/domain/errors/transaction-not-found-error';
import { UpdateTransactionUseCase } from '../update-transaction-use-case';

const userA = uuidv7();
const userB = uuidv7();

let transactionRepo: InMemoryTransactionRepository;
let categoryRepo: InMemoryCategoryRepository;
let mercado: Category;
let lazer: Category;
let categoryB: Category;
let transaction: Transaction;
let sut: UpdateTransactionUseCase;

const createCategory = (userId: string, name: string) =>
  categoryRepo.create(Category.create({ description: null, icon: 'utensils', color: 'blue', userId, name, status: 'active' }));

beforeEach(async () => {
  transactionRepo = new InMemoryTransactionRepository();
  categoryRepo = new InMemoryCategoryRepository();
  mercado = await createCategory(userA, 'Mercado');
  lazer = await createCategory(userA, 'Lazer');
  categoryB = await createCategory(userB, 'Mercado');
  transaction = await transactionRepo.create(
    Transaction.create({ recurringTransactionId: null, description: 'Compra', userId: userA,
      categoryId: mercado.id,
      type: 'expense',
      date: new Date('2026-11-21T12:00:00.000Z'),
      valueInCents: 15050,
      status: 'active',
    }),
  );
  sut = new UpdateTransactionUseCase(transactionRepo, categoryRepo);
});

describe('UpdateTransactionUseCase unit test', () => {
  it('should update the given fields', async () => {
    const updated = await sut.execute({
      userId: userA,
      transactionId: transaction.id,
      categoryId: lazer.id,
      description: 'Show',
      type: 'income',
      date: '2026-12-01T00:00:00.000Z',
      valueInCents: 999,
    });

    expect(updated.toSnapshot()).toMatchObject({
      id: transaction.id,
      categoryId: lazer.id,
      description: 'Show',
      type: 'income',
      date: new Date('2026-12-01T00:00:00.000Z'),
      valueInCents: 999,
      status: 'active',
    });
  });

  it('should leave fields sent as null untouched', async () => {
    const updated = await sut.execute({
      userId: userA,
      transactionId: transaction.id,
      categoryId: null,
      description: null,
      type: null,
      date: null,
      valueInCents: 100,
    });

    expect(updated.toSnapshot()).toEqual({ ...transaction.toSnapshot(), valueInCents: 100 });
  });

  it("should throw CategoryNotFoundError when moving to user B's category", async () => {
    await expect(
      sut.execute({ userId: userA, transactionId: transaction.id, categoryId: categoryB.id }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
    expect(transactionRepo.items.get(transaction.id)?.toSnapshot().categoryId).toBe(mercado.id);
  });

  it('should throw CategoryNotFoundError when moving to a deleted category', async () => {
    await categoryRepo.update({ status: 'deleted' }, lazer.id);

    await expect(
      sut.execute({ userId: userA, transactionId: transaction.id, categoryId: lazer.id }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it('should still edit other fields when its current category was deleted', async () => {
    await categoryRepo.update({ status: 'deleted' }, mercado.id);

    const updated = await sut.execute({
      userId: userA,
      transactionId: transaction.id,
      valueInCents: 100,
    });

    expect(updated.toSnapshot().valueInCents).toBe(100);
  });

  it('should throw TransactionNotFoundError for a transaction of another user', async () => {
    await expect(
      sut.execute({ userId: userB, transactionId: transaction.id, valueInCents: 1 }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
    expect(transactionRepo.items.get(transaction.id)?.toSnapshot().valueInCents).toBe(15050);
  });

  it('should throw TransactionNotFoundError for a deleted transaction', async () => {
    await transactionRepo.update({ status: 'deleted' }, transaction.id);

    await expect(
      sut.execute({ userId: userA, transactionId: transaction.id, valueInCents: 1 }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
  });

  it('should throw TransactionNotFoundError for an unknown id', async () => {
    await expect(
      sut.execute({ userId: userA, transactionId: uuidv7(), valueInCents: 1 }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
  });

  it('should throw InvalidInputError for an invalid value', async () => {
    await expect(
      sut.execute({ userId: userA, transactionId: transaction.id, valueInCents: 0 }),
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});

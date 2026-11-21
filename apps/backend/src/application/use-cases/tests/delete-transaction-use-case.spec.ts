import { beforeEach, describe, expect, it } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { InMemoryTransactionRepository } from '@test/repositories/in-memory-transaction-repository';
import { Transaction } from '@/domain/entities/transaction';
import { InvalidInputError } from '@/domain/errors/invalid-input-error';
import { TransactionNotFoundError } from '@/domain/errors/transaction-not-found-error';
import { DeleteTransactionUseCase } from '../delete-transaction-use-case';

const userId = uuidv7();

let transactionRepo: InMemoryTransactionRepository;
let transaction: Transaction;
let sut: DeleteTransactionUseCase;

beforeEach(async () => {
  transactionRepo = new InMemoryTransactionRepository();
  transaction = await transactionRepo.create(
    Transaction.create({
      userId,
      categoryId: uuidv7(),
      type: 'expense',
      date: new Date('2026-11-21T12:00:00.000Z'),
      valueInCents: 15050,
      status: 'active',
    }),
  );
  sut = new DeleteTransactionUseCase(transactionRepo);
});

describe('DeleteTransactionUseCase unit test', () => {
  it('should mark the transaction as deleted without removing it', async () => {
    const deleted = await sut.execute({ userId, transactionId: transaction.id });

    expect(deleted.isActive).toBe(false);
    expect(transactionRepo.items.get(transaction.id)?.toSnapshot()).toEqual({
      ...transaction.toSnapshot(),
      status: 'deleted',
    });
  });

  it('should throw TransactionNotFoundError when deleting twice', async () => {
    await sut.execute({ userId, transactionId: transaction.id });

    await expect(
      sut.execute({ userId, transactionId: transaction.id }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
  });

  it('should throw TransactionNotFoundError for a transaction of another user', async () => {
    await expect(
      sut.execute({ userId: uuidv7(), transactionId: transaction.id }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
    expect(transactionRepo.items.get(transaction.id)?.isActive).toBe(true);
  });

  it('should throw TransactionNotFoundError for an unknown id', async () => {
    await expect(
      sut.execute({ userId, transactionId: uuidv7() }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
  });

  it('should throw InvalidInputError for an id that is not a uuid', async () => {
    await expect(sut.execute({ userId, transactionId: '123' })).rejects.toBeInstanceOf(
      InvalidInputError,
    );
  });
});

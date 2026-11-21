import { beforeEach, describe, expect, it } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { InMemoryTransactionRepository } from '@test/repositories/in-memory-transaction-repository';
import { Transaction } from '@/domain/entities/transaction';
import { InvalidInputError } from '@/domain/errors/invalid-input-error';
import { ListTransactionsUseCase } from '../list-transactions-use-case';

const userA = uuidv7();
const userB = uuidv7();

let transactionRepo: InMemoryTransactionRepository;
let sut: ListTransactionsUseCase;

const createTransaction = (
  userId: string,
  date: string,
  valueInCents: number,
  status: 'active' | 'deleted' = 'active',
) =>
  transactionRepo.create(
    Transaction.create({
      userId,
      categoryId: uuidv7(),
      type: 'expense',
      date: new Date(date),
      valueInCents,
      status,
    }),
  );

beforeEach(() => {
  transactionRepo = new InMemoryTransactionRepository();
  sut = new ListTransactionsUseCase(transactionRepo);
});

describe('ListTransactionsUseCase unit test', () => {
  it("should list only the user's active transactions, newest first", async () => {
    await createTransaction(userA, '2026-11-01', 100);
    await createTransaction(userA, '2026-11-20', 200);
    await createTransaction(userA, '2026-11-10', 300);
    await createTransaction(userA, '2026-11-30', 400, 'deleted');
    await createTransaction(userB, '2026-11-15', 500);

    const transactions = await sut.execute({ userId: userA });

    expect(transactions.map((t) => t.toSnapshot().valueInCents)).toEqual([200, 300, 100]);
  });

  it('should return an empty list for a user without transactions', async () => {
    await expect(sut.execute({ userId: userA })).resolves.toEqual([]);
  });

  it('should throw InvalidInputError for a user id that is not a uuid', async () => {
    await expect(sut.execute({ userId: '123' })).rejects.toBeInstanceOf(InvalidInputError);
  });
});

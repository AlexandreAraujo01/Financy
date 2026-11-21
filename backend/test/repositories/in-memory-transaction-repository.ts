import { Transaction } from '@/domain/entities/transaction';
import { ITransaction } from '@/domain/entities/props/transaction/transaction';
import { TransactionRepository } from '@/ports/transaction-repository';
import { InMemoryRepository } from './in-memory-repository';

export class InMemoryTransactionRepository
  extends InMemoryRepository<Transaction, ITransaction>
  implements TransactionRepository
{
  findManyActiveByUser(userId: string): Promise<Transaction[]> {
    const transactions = [...this.items.values()]
      .filter((transaction) => transaction.isActive && transaction.toSnapshot().userId === userId)
      .sort(
        (a, b) =>
          b.toSnapshot().date.getTime() - a.toSnapshot().date.getTime() ||
          b.createdAt.getTime() - a.createdAt.getTime(),
      );
    return Promise.resolve(transactions);
  }

  // Imita o índice único (recorrência, data) do banco.
  async createFromRecurrence(transaction: Transaction): Promise<boolean> {
    const { recurringTransactionId, date } = transaction.toSnapshot();
    const exists = [...this.items.values()].some((item) => {
      const snapshot = item.toSnapshot();
      return (
        snapshot.recurringTransactionId === recurringTransactionId &&
        snapshot.date.getTime() === date.getTime()
      );
    });
    if (exists) return false;
    await this.create(transaction);
    return true;
  }

  protected build(props: ITransaction, id: string, createdAt: Date): Transaction {
    return Transaction.create(props, id, createdAt);
  }
}

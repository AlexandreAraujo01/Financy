import { IRecurringTransaction } from '@/domain/entities/props/recurring-transaction/recurring-transaction';
import { RecurringTransaction } from '@/domain/entities/recurring-transaction';
import { RecurringTransactionRepository, type DueRecurrenceCursor } from '@/ports/recurring-transaction-repository';
import { InMemoryRepository } from './in-memory-repository';

export class InMemoryRecurringTransactionRepository
  extends InMemoryRepository<RecurringTransaction, IRecurringTransaction>
  implements RecurringTransactionRepository
{
  findManyDue(onOrBefore: Date, limit: number, after?: DueRecurrenceCursor): Promise<RecurringTransaction[]> {
    const due = [...this.items.values()].filter(recurrence => {
      const { nextDueDate, id } = recurrence.toSnapshot();
      return recurrence.isActive && nextDueDate <= onOrBefore && (!after ||
        nextDueDate > after.nextDueDate || (nextDueDate.getTime() === after.nextDueDate.getTime() && id > after.id));
    }).sort((a, b) => a.toSnapshot().nextDueDate.getTime() - b.toSnapshot().nextDueDate.getTime() ||
      a.id.localeCompare(b.id)).slice(0, limit);
    return Promise.resolve(due);
  }

  findManyActiveByUser(userId: string): Promise<RecurringTransaction[]> {
    const recurrences = [...this.items.values()]
      .filter((recurrence) => recurrence.isActive && recurrence.toSnapshot().userId === userId)
      .sort(
        (a, b) =>
          a.toSnapshot().nextDueDate.getTime() - b.toSnapshot().nextDueDate.getTime(),
      );
    return Promise.resolve(recurrences);
  }

  protected build(props: IRecurringTransaction, id: string, createdAt: Date): RecurringTransaction {
    return RecurringTransaction.create(props, id, createdAt);
  }
}

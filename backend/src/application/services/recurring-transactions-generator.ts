import { RecurringTransaction } from '@/domain/entities/recurring-transaction';
import { Transaction } from '@/domain/entities/transaction';
import { Clock } from '@/ports/clock';
import { RecurringTransactionRepository, type DueRecurrenceCursor } from '@/ports/recurring-transaction-repository';
import { TransactionRepository } from '@/ports/transaction-repository';
import { recurrenceDay } from './recurrence-day';

// O job diário processa somente vencidas. A criação também pode gerar a primeira
// ocorrência imediatamente. O índice único impede duplicar recorrência e data.
export class RecurringTransactionsGenerator {
  constructor(
    private readonly recurrences: RecurringTransactionRepository,
    private readonly transactions: TransactionRepository,
    private readonly clock: Clock,
  ) {}

  async generateDue(onError?: (error: unknown, recurrenceId: string) => void): Promise<{ processed: number; failed: number }> {
    const today = recurrenceDay(this.clock.now());
    let after: DueRecurrenceCursor | undefined;
    const result = { processed: 0, failed: 0 };
    for (;;) {
      const batch = await this.recurrences.findManyDue(today, 100, after);
      if (batch.length === 0) return result;
      const last = batch[batch.length - 1]!;
      after = { id: last.id, nextDueDate: last.toSnapshot().nextDueDate };
      for (const recurrence of batch) {
        try {
          await this.generate(recurrence, today);
          result.processed++;
        } catch (error) {
          result.failed++;
          onError?.(error, recurrence.id);
        }
      }
    }
  }

  async generate(recurrence: RecurringTransaction, today = recurrenceDay(this.clock.now())): Promise<RecurringTransaction> {
    const dates = recurrence.dueDates(today);
    const last = dates.at(-1);
    if (!last) return recurrence;

    const { userId, categoryId, description, type, valueInCents } = recurrence.toSnapshot();
    for (const date of dates) {
      await this.transactions.createFromRecurrence(
        Transaction.create({
          userId,
          categoryId,
          description,
          type,
          valueInCents,
          date,
          status: 'active',
          recurringTransactionId: recurrence.id,
        }),
      );
    }

    const nextDueDate = recurrence.occurrenceAfter(last);
    return (await this.recurrences.update({ nextDueDate }, recurrence.id)) ?? recurrence;
  }
}

import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import {
  EndRecurringTransactionInput,
  endRecurringTransactionInputSchema,
} from './dto/input/end-recurring-transaction-input';
import { RecurringTransaction } from '@/domain/entities/recurring-transaction';
import { RecurringTransactionNotFoundError } from '@/domain/errors/recurring-transaction-not-found-error';
import { RecurringTransactionRepository } from '@/ports/recurring-transaction-repository';

// Para de gerar novos meses; as transações já geradas continuam no histórico.
export class EndRecurringTransactionUseCase extends UseCase<
  EndRecurringTransactionInput,
  RecurringTransaction
> {
  constructor(private readonly recurrences: RecurringTransactionRepository) {
    super();
  }

  async execute(input: EndRecurringTransactionInput): Promise<RecurringTransaction> {
    const { userId, recurringTransactionId } = validate(endRecurringTransactionInputSchema, input);

    const recurrence = await this.recurrences.find(recurringTransactionId);
    if (!recurrence?.isActive || recurrence.toSnapshot().userId !== userId) {
      throw new RecurringTransactionNotFoundError(recurringTransactionId);
    }

    const ended = await this.recurrences.update({ status: 'ended' }, recurringTransactionId);
    if (!ended) {
      throw new RecurringTransactionNotFoundError(recurringTransactionId);
    }

    return ended;
  }
}

import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import {
  ListRecurringTransactionsInput,
  listRecurringTransactionsInputSchema,
} from './dto/input/list-recurring-transactions-input';
import { RecurringTransaction } from '@/domain/entities/recurring-transaction';
import { RecurringTransactionRepository } from '@/ports/recurring-transaction-repository';

export class ListRecurringTransactionsUseCase extends UseCase<
  ListRecurringTransactionsInput,
  RecurringTransaction[]
> {
  constructor(private readonly recurrences: RecurringTransactionRepository) {
    super();
  }

  async execute(input: ListRecurringTransactionsInput): Promise<RecurringTransaction[]> {
    const { userId } = validate(listRecurringTransactionsInputSchema, input);
    return this.recurrences.findManyActiveByUser(userId);
  }
}

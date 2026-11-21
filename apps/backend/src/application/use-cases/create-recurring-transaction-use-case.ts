import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import {
  CreateRecurringTransactionInput,
  createRecurringTransactionInputSchema,
} from './dto/input/create-recurring-transaction-input';
import { findOwnedCategory } from '@/application/services/find-owned-category';
import { RecurringTransactionsGenerator } from '@/application/services/recurring-transactions-generator';
import { RecurringTransaction } from '@/domain/entities/recurring-transaction';
import { CategoryRepository } from '@/ports/category-repository';
import { RecurringTransactionRepository } from '@/ports/recurring-transaction-repository';

export class CreateRecurringTransactionUseCase extends UseCase<
  CreateRecurringTransactionInput,
  RecurringTransaction
> {
  constructor(
    private readonly recurrences: RecurringTransactionRepository,
    private readonly categories: CategoryRepository,
    private readonly generator: RecurringTransactionsGenerator,
  ) {
    super();
  }

  async execute(input: CreateRecurringTransactionInput): Promise<RecurringTransaction> {
    const data = validate(createRecurringTransactionInputSchema, input);

    await findOwnedCategory(this.categories, data.userId, data.categoryId);

    const recurrence = await this.recurrences.create(
      RecurringTransaction.create({
        ...data,
        nextDueDate: RecurringTransaction.firstOccurrence(data.startDate, data.dayOfMonth, data.dayType),
        status: 'active',
      }),
    );

    // Se a primeira ocorrência já é hoje (ou ficou no passado), ela aparece na hora.
    return this.generator.generate(recurrence);
  }
}

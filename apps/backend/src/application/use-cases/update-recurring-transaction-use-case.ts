import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import {
  UpdateRecurringTransactionInput,
  updateRecurringTransactionInputSchema,
} from './dto/input/update-recurring-transaction-input';
import { findOwnedCategory } from '@/application/services/find-owned-category';
import { recurringScheduleSchema } from './dto/input/recurring-transaction-fields';
import { IRecurringTransaction } from '@/domain/entities/props/recurring-transaction/recurring-transaction';
import { occurrenceOn, RecurringTransaction, startOfDay } from '@/domain/entities/recurring-transaction';
import { RecurringTransactionNotFoundError } from '@/domain/errors/recurring-transaction-not-found-error';
import { CategoryRepository } from '@/ports/category-repository';
import { RecurringTransactionRepository } from '@/ports/recurring-transaction-repository';

// Vale só pros próximos lançamentos: as transações já geradas ficam como estão.
export class UpdateRecurringTransactionUseCase extends UseCase<
  UpdateRecurringTransactionInput,
  RecurringTransaction
> {
  constructor(
    private readonly recurrences: RecurringTransactionRepository,
    private readonly categories: CategoryRepository,
  ) {
    super();
  }

  async execute(input: UpdateRecurringTransactionInput): Promise<RecurringTransaction> {
    const { userId, recurringTransactionId, categoryId, description, type, valueInCents, dayOfMonth, dayType } =
      validate(updateRecurringTransactionInputSchema, input);

    const recurrence = await this.recurrences.find(recurringTransactionId);
    // Recorrência de outro usuário responde como inexistente, pra não revelar que existe.
    if (!recurrence?.isActive || recurrence.toSnapshot().userId !== userId) {
      throw new RecurringTransactionNotFoundError(recurringTransactionId);
    }

    const changes: Partial<IRecurringTransaction> = {};
    if (categoryId != null) {
      await findOwnedCategory(this.categories, userId, categoryId);
      changes.categoryId = categoryId;
    }
    if (description != null) changes.description = description;
    if (type != null) changes.type = type;
    if (valueInCents != null) changes.valueInCents = valueInCents;
    if (dayOfMonth != null || dayType != null) {
      const current = recurrence.toSnapshot();
      const schedule = validate(recurringScheduleSchema, {
        dayOfMonth: dayOfMonth ?? current.dayOfMonth,
        dayType: dayType ?? current.dayType,
      });
      Object.assign(changes, schedule);
      // Recalcula só a primeira competência ainda não gerada, respeitando o início.
      const next = current.nextDueDate;
      const monthStart = occurrenceOn(next.getUTCFullYear(), next.getUTCMonth(), 1);
      const lowerBound = new Date(Math.max(monthStart.getTime(), startOfDay(current.startDate).getTime()));
      changes.nextDueDate = RecurringTransaction.firstOccurrence(
        lowerBound, schedule.dayOfMonth, schedule.dayType,
      );
    }

    const updated = await this.recurrences.update(changes, recurringTransactionId);
    if (!updated) {
      throw new RecurringTransactionNotFoundError(recurringTransactionId);
    }

    return updated;
  }
}

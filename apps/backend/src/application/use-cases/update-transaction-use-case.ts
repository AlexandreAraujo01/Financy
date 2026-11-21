import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import {
  UpdateTransactionInput,
  updateTransactionInputSchema,
} from './dto/input/update-transaction-input';
import { findOwnedCategory } from '@/application/services/find-owned-category';
import { ITransaction } from '@/domain/entities/props/transaction/transaction';
import { Transaction } from '@/domain/entities/transaction';
import { TransactionNotFoundError } from '@/domain/errors/transaction-not-found-error';
import { CategoryRepository } from '@/ports/category-repository';
import { TransactionRepository } from '@/ports/transaction-repository';

export class UpdateTransactionUseCase extends UseCase<UpdateTransactionInput, Transaction> {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly categories: CategoryRepository,
  ) {
    super();
  }

  async execute(input: UpdateTransactionInput): Promise<Transaction> {
    const { userId, transactionId, categoryId, description, type, date, valueInCents } = validate(
      updateTransactionInputSchema,
      input,
    );

    const transaction = await this.transactions.find(transactionId);
    // Transação de outro usuário responde como inexistente, pra não revelar que existe.
    if (!transaction?.isActive || transaction.toSnapshot().userId !== userId) {
      throw new TransactionNotFoundError(transactionId);
    }

    const changes: Partial<ITransaction> = {};
    if (categoryId != null) {
      await findOwnedCategory(this.categories, userId, categoryId);
      changes.categoryId = categoryId;
    }
    if (description != null) changes.description = description;
    if (type != null) changes.type = type;
    if (date != null) changes.date = date;
    if (valueInCents != null) changes.valueInCents = valueInCents;

    const updated = await this.transactions.update(changes, transactionId);
    if (!updated) {
      throw new TransactionNotFoundError(transactionId);
    }

    return updated;
  }
}

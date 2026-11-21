import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import {
  CreateTransactionInput,
  createTransactionInputSchema,
} from './dto/input/create-transaction-input';
import { findOwnedCategory } from '@/application/services/find-owned-category';
import { Transaction } from '@/domain/entities/transaction';
import { CategoryRepository } from '@/ports/category-repository';
import { TransactionRepository } from '@/ports/transaction-repository';

export class CreateTransactionUseCase extends UseCase<CreateTransactionInput, Transaction> {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly categories: CategoryRepository,
  ) {
    super();
  }

  async execute(input: CreateTransactionInput): Promise<Transaction> {
    const data = validate(createTransactionInputSchema, input);

    await findOwnedCategory(this.categories, data.userId, data.categoryId);

    return this.transactions.create(Transaction.create({ ...data, status: 'active', recurringTransactionId: null }));
  }
}

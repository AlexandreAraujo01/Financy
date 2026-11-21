import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import {
  ListTransactionsInput,
  listTransactionsInputSchema,
} from './dto/input/list-transactions-input';
import { Transaction } from '@/domain/entities/transaction';
import { TransactionRepository } from '@/ports/transaction-repository';

export class ListTransactionsUseCase extends UseCase<ListTransactionsInput, Transaction[]> {
  constructor(private readonly transactions: TransactionRepository) {
    super();
  }

  async execute(input: ListTransactionsInput): Promise<Transaction[]> {
    const { userId } = validate(listTransactionsInputSchema, input);
    return this.transactions.findManyActiveByUser(userId);
  }
}

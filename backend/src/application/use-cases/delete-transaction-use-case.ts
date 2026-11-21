import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import {
  DeleteTransactionInput,
  deleteTransactionInputSchema,
} from './dto/input/delete-transaction-input';
import { Transaction } from '@/domain/entities/transaction';
import { TransactionNotFoundError } from '@/domain/errors/transaction-not-found-error';
import { TransactionRepository } from '@/ports/transaction-repository';

export class DeleteTransactionUseCase extends UseCase<DeleteTransactionInput, Transaction> {
  constructor(private readonly transactions: TransactionRepository) {
    super();
  }

  async execute(input: DeleteTransactionInput): Promise<Transaction> {
    const { userId, transactionId } = validate(deleteTransactionInputSchema, input);

    const transaction = await this.transactions.find(transactionId);
    if (!transaction?.isActive || transaction.toSnapshot().userId !== userId) {
      throw new TransactionNotFoundError(transactionId);
    }

    // Soft delete: a linha fica no banco, só sai das listagens e do saldo.
    const deleted = await this.transactions.update({ status: 'deleted' }, transactionId);
    if (!deleted) {
      throw new TransactionNotFoundError(transactionId);
    }

    return deleted;
  }
}

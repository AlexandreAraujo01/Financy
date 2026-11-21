import { Arg, Authorized, ID, Mutation, Query, Resolver } from 'type-graphql'
import { CreateTransactionInput, UpdateTransactionInput } from './inputs/transaction.input';
import { TransactionModel } from './models/transaction.model';
import { CurrentUserId } from './auth/current-user-id';
import { CreateTransactionUseCase } from '@/application/use-cases/create-transaction-use-case';
import { UpdateTransactionUseCase } from '@/application/use-cases/update-transaction-use-case';
import { DeleteTransactionUseCase } from '@/application/use-cases/delete-transaction-use-case';
import { ListTransactionsUseCase } from '@/application/use-cases/list-transactions-use-case';

@Authorized()
@Resolver()
export class TransactionResolver {

    constructor(
        private readonly createTransactionUseCase: CreateTransactionUseCase,
        private readonly updateTransactionUseCase: UpdateTransactionUseCase,
        private readonly deleteTransactionUseCase: DeleteTransactionUseCase,
        private readonly listTransactionsUseCase: ListTransactionsUseCase,
    ) {}

    @Query(() => [TransactionModel])
    async transactions(@CurrentUserId() userId: string): Promise<TransactionModel[]> {
        const transactions = await this.listTransactionsUseCase.execute({ userId })
        return transactions.map(TransactionModel.fromEntity)
    }

    @Mutation(() => TransactionModel)
    async createTransaction(
        @CurrentUserId() userId: string,
        @Arg('data', () => CreateTransactionInput) data: CreateTransactionInput,
    ): Promise<TransactionModel> {
        const transaction = await this.createTransactionUseCase.execute({ userId, ...data })
        return TransactionModel.fromEntity(transaction)
    }

    @Mutation(() => TransactionModel)
    async updateTransaction(
        @CurrentUserId() userId: string,
        @Arg('id', () => ID) id: string,
        @Arg('data', () => UpdateTransactionInput) data: UpdateTransactionInput,
    ): Promise<TransactionModel> {
        const transaction = await this.updateTransactionUseCase.execute({ userId, transactionId: id, ...data })
        return TransactionModel.fromEntity(transaction)
    }

    @Mutation(() => TransactionModel)
    async deleteTransaction(
        @CurrentUserId() userId: string,
        @Arg('id', () => ID) id: string,
    ): Promise<TransactionModel> {
        const transaction = await this.deleteTransactionUseCase.execute({ userId, transactionId: id })
        return TransactionModel.fromEntity(transaction)
    }

}

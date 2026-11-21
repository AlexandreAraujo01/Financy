import { Arg, Authorized, ID, Mutation, Query, Resolver } from 'type-graphql'
import {
    CreateRecurringTransactionInput,
    UpdateRecurringTransactionInput,
} from './inputs/recurring-transaction.input';
import { RecurringTransactionModel } from './models/recurring-transaction.model';
import { CurrentUserId } from './auth/current-user-id';
import { CreateRecurringTransactionUseCase } from '@/application/use-cases/create-recurring-transaction-use-case';
import { UpdateRecurringTransactionUseCase } from '@/application/use-cases/update-recurring-transaction-use-case';
import { EndRecurringTransactionUseCase } from '@/application/use-cases/end-recurring-transaction-use-case';
import { ListRecurringTransactionsUseCase } from '@/application/use-cases/list-recurring-transactions-use-case';

@Authorized()
@Resolver()
export class RecurringTransactionResolver {

    constructor(
        private readonly createRecurringTransactionUseCase: CreateRecurringTransactionUseCase,
        private readonly updateRecurringTransactionUseCase: UpdateRecurringTransactionUseCase,
        private readonly endRecurringTransactionUseCase: EndRecurringTransactionUseCase,
        private readonly listRecurringTransactionsUseCase: ListRecurringTransactionsUseCase,
    ) {}

    @Query(() => [RecurringTransactionModel])
    async recurringTransactions(@CurrentUserId() userId: string): Promise<RecurringTransactionModel[]> {
        const recurrences = await this.listRecurringTransactionsUseCase.execute({ userId })
        return recurrences.map(RecurringTransactionModel.fromEntity)
    }

    @Mutation(() => RecurringTransactionModel)
    async createRecurringTransaction(
        @CurrentUserId() userId: string,
        @Arg('data', () => CreateRecurringTransactionInput) data: CreateRecurringTransactionInput,
    ): Promise<RecurringTransactionModel> {
        const recurrence = await this.createRecurringTransactionUseCase.execute({ userId, ...data })
        return RecurringTransactionModel.fromEntity(recurrence)
    }

    @Mutation(() => RecurringTransactionModel)
    async updateRecurringTransaction(
        @CurrentUserId() userId: string,
        @Arg('id', () => ID) id: string,
        @Arg('data', () => UpdateRecurringTransactionInput) data: UpdateRecurringTransactionInput,
    ): Promise<RecurringTransactionModel> {
        const recurrence = await this.updateRecurringTransactionUseCase.execute({
            userId,
            recurringTransactionId: id,
            ...data,
        })
        return RecurringTransactionModel.fromEntity(recurrence)
    }

    // Para de gerar os próximos meses; o que já foi gerado continua no histórico.
    @Mutation(() => RecurringTransactionModel)
    async endRecurringTransaction(
        @CurrentUserId() userId: string,
        @Arg('id', () => ID) id: string,
    ): Promise<RecurringTransactionModel> {
        const recurrence = await this.endRecurringTransactionUseCase.execute({
            userId,
            recurringTransactionId: id,
        })
        return RecurringTransactionModel.fromEntity(recurrence)
    }

}

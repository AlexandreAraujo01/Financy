import { Field, ID, Int, ObjectType } from "type-graphql"
import { RecurringTransaction } from "@/domain/entities/recurring-transaction"
import type { TransactionType } from "@/domain/entities/props/transaction/transaction"
import { TransactionTypeEnum } from "./transaction-type.enum"
import type { RecurringDayType } from '@/domain/entities/props/recurring-transaction/recurring-transaction'
import { RecurringDayTypeEnum } from './recurring-day-type.enum'

@ObjectType()
export class RecurringTransactionModel {
    @Field(() => ID)
    id!: string
    @Field(() => ID)
    categoryId!: string
    @Field(() => String)
    description!: string
    @Field(() => TransactionTypeEnum)
    type!: TransactionType
    // Em centavos (R$ 150,50 = 15050).
    @Field(() => Int)
    valueInCents!: number
    @Field(() => Int)
    dayOfMonth!: number
    @Field(() => RecurringDayTypeEnum)
    dayType!: RecurringDayType
    @Field(() => Date)
    startDate!: Date
    @Field(() => Date)
    nextDueDate!: Date
    @Field(() => Date)
    createdAt!: Date

    static fromEntity(recurrence: RecurringTransaction): RecurringTransactionModel {
        const { id, categoryId, description, type, valueInCents, dayOfMonth, dayType, startDate, nextDueDate, createdAt } =
            recurrence.toSnapshot()
        return { id, categoryId, description, type, valueInCents, dayOfMonth, dayType, startDate, nextDueDate, createdAt }
    }
}

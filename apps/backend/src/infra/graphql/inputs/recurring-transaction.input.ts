import { Field, ID, InputType, Int } from "type-graphql"
import type { TransactionType } from "@/domain/entities/props/transaction/transaction"
import { TransactionTypeEnum } from "../models/transaction-type.enum"
import type { RecurringDayType } from '@/domain/entities/props/recurring-transaction/recurring-transaction'
import { RecurringDayTypeEnum } from '../models/recurring-day-type.enum'

@InputType()
export class CreateRecurringTransactionInput {
    @Field(() => ID)
    categoryId!: string
    @Field(() => String)
    description!: string
    @Field(() => TransactionTypeEnum)
    type!: TransactionType
    @Field(() => Int)
    valueInCents!: number
    // Dia fixo (1 a 31) ou posição do dia útil no mês (1 a 23).
    @Field(() => Int)
    dayOfMonth!: number
    @Field(() => RecurringDayTypeEnum, { defaultValue: 'calendar_day' })
    dayType!: RecurringDayType
    @Field(() => Date)
    startDate!: Date
}

@InputType()
export class UpdateRecurringTransactionInput {
    @Field(() => ID, { nullable: true })
    categoryId?: string
    @Field(() => String, { nullable: true })
    description?: string
    @Field(() => TransactionTypeEnum, { nullable: true })
    type?: TransactionType
    @Field(() => Int, { nullable: true })
    valueInCents?: number
    @Field(() => Int, { nullable: true })
    dayOfMonth?: number
    @Field(() => RecurringDayTypeEnum, { nullable: true })
    dayType?: RecurringDayType
}

import { Field, ID, InputType, Int } from "type-graphql"
import type { TransactionType } from "@/domain/entities/props/transaction/transaction"
import { TransactionTypeEnum } from "../models/transaction-type.enum"

@InputType()
export class CreateTransactionInput {
    @Field(() => ID)
    categoryId!: string
    @Field(() => TransactionTypeEnum)
    type!: TransactionType
    @Field(() => Date)
    date!: Date
    // Em centavos (R$ 150,50 = 15050).
    @Field(() => Int)
    valueInCents!: number
}

@InputType()
export class UpdateTransactionInput {
    @Field(() => ID, { nullable: true })
    categoryId?: string
    @Field(() => TransactionTypeEnum, { nullable: true })
    type?: TransactionType
    @Field(() => Date, { nullable: true })
    date?: Date
    @Field(() => Int, { nullable: true })
    valueInCents?: number
}

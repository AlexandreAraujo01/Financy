import { Field, ID, Int, ObjectType } from "type-graphql"
import { Transaction } from "@/domain/entities/transaction"
import type { TransactionType } from "@/domain/entities/props/transaction/transaction"
import { TransactionTypeEnum } from "./transaction-type.enum"

@ObjectType()
export class TransactionModel {
    @Field(() => ID)
    id!: string
    @Field(() => ID)
    categoryId!: string
    @Field(() => TransactionTypeEnum)
    type!: TransactionType
    @Field(() => Date)
    date!: Date
    // Em centavos (R$ 150,50 = 15050).
    @Field(() => Int)
    valueInCents!: number
    @Field(() => Date)
    createdAt!: Date

    static fromEntity(transaction: Transaction): TransactionModel {
        const { id, categoryId, type, date, valueInCents, createdAt } = transaction.toSnapshot()
        return { id, categoryId, type, date, valueInCents, createdAt }
    }
}

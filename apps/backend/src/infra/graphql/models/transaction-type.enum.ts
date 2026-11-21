import { registerEnumType } from "type-graphql"
import { TRANSACTION_TYPES, TransactionType } from "@/domain/entities/props/transaction/transaction"

// Gera o enum do GraphQL a partir dos mesmos valores do domínio e do banco.
export const TransactionTypeEnum = Object.fromEntries(
    TRANSACTION_TYPES.map((type) => [type, type]),
) as { [K in TransactionType]: K }

registerEnumType(TransactionTypeEnum, { name: "TransactionType" })

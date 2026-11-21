import { Field, ID, ObjectType } from "type-graphql"
import { Category } from "@/domain/entities/category"

@ObjectType()
export class CategoryModel {
    @Field(() => ID)
    id!: string
    @Field(() => String)
    name!: string
    @Field(() => Date)
    createdAt!: Date

    static fromEntity(category: Category): CategoryModel {
        const { id, name, createdAt } = category.toSnapshot()
        return { id, name, createdAt }
    }
}

import { Field, ID, ObjectType } from "type-graphql"
import { Category } from "@/domain/entities/category"
import type { CategoryColor, CategoryIcon } from "@/domain/entities/props/category/category"
import { CategoryColorEnum, CategoryIconEnum } from "./category-enums"

@ObjectType()
export class CategoryModel {
    @Field(() => ID)
    id!: string
    @Field(() => String)
    name!: string
    @Field(() => String, { nullable: true })
    description!: string | null
    @Field(() => CategoryIconEnum)
    icon!: CategoryIcon
    @Field(() => CategoryColorEnum)
    color!: CategoryColor
    @Field(() => Date)
    createdAt!: Date

    static fromEntity(category: Category): CategoryModel {
        const { id, name, description, icon, color, createdAt } = category.toSnapshot()
        return { id, name, description, icon, color, createdAt }
    }
}

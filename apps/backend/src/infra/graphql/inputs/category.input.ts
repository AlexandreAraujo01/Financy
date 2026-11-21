import { Field, InputType } from "type-graphql"
import type { CategoryColor, CategoryIcon } from "@/domain/entities/props/category/category"
import { CategoryColorEnum, CategoryIconEnum } from "../models/category-enums"

@InputType()
export class CreateCategoryInput {
    @Field(() => String)
    name!: string
    @Field(() => String, { nullable: true })
    description?: string | null
    @Field(() => CategoryIconEnum)
    icon!: CategoryIcon
    @Field(() => CategoryColorEnum)
    color!: CategoryColor
}

// Substitui a categoria inteira, como o formulário de edição manda.
@InputType()
export class UpdateCategoryInput extends CreateCategoryInput {}

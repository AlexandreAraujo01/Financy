import { registerEnumType } from "type-graphql"
import {
    CATEGORY_COLORS,
    CATEGORY_ICONS,
    CategoryColor,
    CategoryIcon,
} from "@/domain/entities/props/category/category"

// Gera os enums do GraphQL a partir dos mesmos valores do domínio e do banco.
export const CategoryIconEnum = Object.fromEntries(
    CATEGORY_ICONS.map((icon) => [icon, icon]),
) as { [K in CategoryIcon]: K }

export const CategoryColorEnum = Object.fromEntries(
    CATEGORY_COLORS.map((color) => [color, color]),
) as { [K in CategoryColor]: K }

registerEnumType(CategoryIconEnum, { name: "CategoryIcon" })
registerEnumType(CategoryColorEnum, { name: "CategoryColor" })

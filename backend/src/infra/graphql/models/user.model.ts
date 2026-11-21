import { Field, ID, ObjectType } from "type-graphql"
import { User } from "@/domain/entities/user"

@ObjectType()
export class UserModel {
    @Field(() => ID)
    id!: string
    @Field(() => String)
    name!: string
    @Field(() => String)
    email!: string
    @Field(() => Date)
    createdAt!: Date

    static fromEntity(user: User): UserModel {
        const { id, name, email, createdAt } = user.toSnapshot()
        return { id, name, email, createdAt }
    }
}

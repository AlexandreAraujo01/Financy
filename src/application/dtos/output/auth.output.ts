import { Field, ObjectType } from "type-graphql"
import { UserModel } from "../../../infra/graphql/models/user.model"

@ObjectType()
export class RegisterOutput {
    @Field(() => String)
    token!: string
    @Field(() => UserModel)
    user!: UserModel
}

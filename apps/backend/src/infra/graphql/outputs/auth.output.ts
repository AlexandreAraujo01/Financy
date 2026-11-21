import { Field, ObjectType } from "type-graphql"
import { UserModel } from "@/infra/graphql/models/user.model"

// Resposta de register e login: o usuário autenticado e o token dele.
@ObjectType()
export class AuthOutput {
    @Field(() => String)
    token!: string
    @Field(() => UserModel)
    user!: UserModel
}

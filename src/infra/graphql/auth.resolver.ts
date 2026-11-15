import {Resolver, Mutation, Arg } from 'type-graphql'
import { RegisterInput } from '../../application/dtos/input/auth.input';
import { RegisterOutput } from '../../application/dtos/output/auth.output';
import { CreateUserUseCase } from '../../application/use-cases/create-user-use-case';
import { UserModel } from './models/user.model';

@Resolver()
export class AuthResolver {

    constructor(private readonly createUser: CreateUserUseCase) {}

    @Mutation(() => RegisterOutput)
    async register(@Arg('data', () => RegisterInput) data: RegisterInput): Promise<RegisterOutput> {
        const user = await this.createUser.execute(data)

        // TODO: gerar o JWT
        return { token: '', user: UserModel.fromEntity(user) }
    }

}

import {Resolver, Mutation, Arg } from 'type-graphql'
import { RegisterInput } from './inputs/auth.input';
import { AuthOutput } from './outputs/auth.output';
import { CreateUserUseCase } from '@/application/use-cases/create-user-use-case';
import { LoginUserUseCase } from '@/application/use-cases/login-user-use-case';
import { UserModel } from './models/user.model';
import { LoginInput } from './inputs/login.input';

@Resolver()
export class AuthResolver {

    constructor(
        private readonly createUser: CreateUserUseCase,
        private readonly loginUser: LoginUserUseCase,
    ) {}

    @Mutation(() => AuthOutput)
    async register(@Arg('data', () => RegisterInput) data: RegisterInput): Promise<AuthOutput> {
        const { user, token } = await this.createUser.execute(data)
        return { token, user: UserModel.fromEntity(user) }
    }

    @Mutation(() => AuthOutput)
    async login(@Arg('data', () => LoginInput) data: LoginInput): Promise<AuthOutput> {
        const { user, token } = await this.loginUser.execute(data)
        return { token, user: UserModel.fromEntity(user) }
    }

}

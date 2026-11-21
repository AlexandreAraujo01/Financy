import { Arg, Authorized, Mutation, Query, Resolver } from 'type-graphql'
import { UpdateUserInput } from './inputs/user.input';
import { FindUserUseCase } from '@/application/use-cases/find-user-use-case';
import { UpdateUserUseCase } from '@/application/use-cases/update-user-use-case';
import { DeleteUserUseCase } from '@/application/use-cases/delete-user-use-case';
import { UserModel } from './models/user.model';
import { CurrentUserId } from './auth/current-user-id';

// Cada usuário só vê e altera a própria conta: o id vem do token, não do input.
@Authorized()
@Resolver()
export class UserResolver {

    constructor(
        private readonly findUserUseCase: FindUserUseCase,
        private readonly updateUserUseCase: UpdateUserUseCase,
        private readonly deleteUserUseCase: DeleteUserUseCase,
    ) {}

    @Query(() => UserModel)
    async me(@CurrentUserId() userId: string): Promise<UserModel> {
        const user = await this.findUserUseCase.execute({ userId })
        return UserModel.fromEntity(user)
    }

    @Mutation(() => UserModel)
    async updateMe(
        @CurrentUserId() userId: string,
        @Arg('data', () => UpdateUserInput) data: UpdateUserInput,
    ): Promise<UserModel> {
        const user = await this.updateUserUseCase.execute({ userId, ...data })
        return UserModel.fromEntity(user)
    }

    @Mutation(() => UserModel)
    async deleteMe(@CurrentUserId() userId: string): Promise<UserModel> {
        const user = await this.deleteUserUseCase.execute({ userId })
        return UserModel.fromEntity(user)
    }

}

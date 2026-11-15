import { Arg, ID, Mutation, Query, Resolver } from 'type-graphql'
import { UpdateUserInput } from '../../application/dtos/input/user.input';
import { FindUserUseCase } from '../../application/use-cases/find-user-use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user-use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user-use-case';
import { UserModel } from './models/user.model';

@Resolver()
export class UserResolver {

    constructor(
        private readonly findUserUseCase: FindUserUseCase,
        private readonly updateUserUseCase: UpdateUserUseCase,
        private readonly deleteUserUseCase: DeleteUserUseCase,
    ) {}

    @Query(() => UserModel)
    async user(@Arg('id', () => ID) id: string): Promise<UserModel> {
        const user = await this.findUserUseCase.execute({ userId: id })
        return UserModel.fromEntity(user)
    }

    @Mutation(() => UserModel)
    async updateUser(
        @Arg('id', () => ID) id: string,
        @Arg('data', () => UpdateUserInput) data: UpdateUserInput,
    ): Promise<UserModel> {
        const user = await this.updateUserUseCase.execute({ userId: id, ...data })
        return UserModel.fromEntity(user)
    }

    @Mutation(() => UserModel)
    async deleteUser(@Arg('id', () => ID) id: string): Promise<UserModel> {
        const user = await this.deleteUserUseCase.execute({ userId: id })
        return UserModel.fromEntity(user)
    }

}

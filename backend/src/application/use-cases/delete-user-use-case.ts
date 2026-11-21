import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import { DeleteUserInput, deleteUserInputSchema } from './dto/input/delete-user-input';
import { User } from '@/domain/entities/user';
import { UserNotFoundError } from '@/domain/errors/user-not-found-error';
import { UserRepository } from '@/ports/user-repository';

export class DeleteUserUseCase extends UseCase<DeleteUserInput, User> {
  constructor(private readonly users: UserRepository) {
    super();
  }

  async execute(input: DeleteUserInput): Promise<User> {
    const { userId } = validate(deleteUserInputSchema, input);
    const user = await this.users.delete(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return user;
  }
}

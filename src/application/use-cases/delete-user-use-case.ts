import { UseCase } from './core/use-case';
import { DeleteUserInput } from './dto/input/delete-user-input';
import { User } from '../../domain/entities/user';
import { UserNotFoundError } from '../../domain/errors/user-not-found-error';
import { UserRepository } from '../../ports/user-repository';

export class DeleteUserUseCase extends UseCase<DeleteUserInput, User> {
  constructor(private readonly users: UserRepository) {
    super();
  }

  async execute(input: DeleteUserInput): Promise<User> {
    const user = await this.users.delete(input.userId);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    return user;
  }
}

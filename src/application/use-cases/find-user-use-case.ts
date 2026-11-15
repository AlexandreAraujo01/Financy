import { UseCase } from './core/use-case';
import { FindUserInput } from './dto/input/find-user-input';
import { User } from '../../domain/entities/user';
import { UserNotFoundError } from '../../domain/errors/user-not-found-error';
import { UserRepository } from '../../ports/user-repository';

export class FindUserUseCase extends UseCase<FindUserInput, User> {
  constructor(private readonly users: UserRepository) {
    super();
  }

  async execute(input: FindUserInput): Promise<User> {
    const user = await this.users.find(input.userId);

    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    return user;
  }
}

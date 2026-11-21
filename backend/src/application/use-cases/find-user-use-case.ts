import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import { FindUserInput, findUserInputSchema } from './dto/input/find-user-input';
import { User } from '@/domain/entities/user';
import { UserNotFoundError } from '@/domain/errors/user-not-found-error';
import { UserRepository } from '@/ports/user-repository';

export class FindUserUseCase extends UseCase<FindUserInput, User> {
  constructor(private readonly users: UserRepository) {
    super();
  }

  async execute(input: FindUserInput): Promise<User> {
    const { userId } = validate(findUserInputSchema, input);
    const user = await this.users.find(userId);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return user;
  }
}

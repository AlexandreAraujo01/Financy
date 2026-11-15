import { UseCase } from './core/use-case';
import { UpdateUserInput } from './dto/input/update-user-input';
import { User } from '../../domain/entities/user';
import { IUser } from '../../domain/entities/props/user/user';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists-error';
import { UserNotFoundError } from '../../domain/errors/user-not-found-error';
import { UserRepository } from '../../ports/user-repository';

export class UpdateUserUseCase extends UseCase<UpdateUserInput, User> {
  constructor(private readonly users: UserRepository) {
    super();
  }

  async execute(input: UpdateUserInput): Promise<User> {
    const changes: Partial<IUser> = {};
    if (input.name != null) changes.name = input.name;
    if (input.email != null) changes.email = User.normalizeEmail(input.email);

    if (changes.email) {
      const owner = await this.users.findByEmail(changes.email);
      if (owner && owner.id !== input.userId) {
        throw new UserAlreadyExistsError(changes.email);
      }
    }

    const user = await this.users.update(changes, input.userId);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    return user;
  }
}

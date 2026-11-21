import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import { UpdateUserInput, updateUserInputSchema } from './dto/input/update-user-input';
import { User } from '@/domain/entities/user';
import { IUser } from '@/domain/entities/props/user/user';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists-error';
import { UserNotFoundError } from '@/domain/errors/user-not-found-error';
import { UserRepository } from '@/ports/user-repository';

export class UpdateUserUseCase extends UseCase<UpdateUserInput, User> {
  constructor(private readonly users: UserRepository) {
    super();
  }

  async execute(input: UpdateUserInput): Promise<User> {
    const { userId, name, email } = validate(updateUserInputSchema, input);
    const changes: Partial<IUser> = {};
    if (name != null) changes.name = name;
    if (email != null) changes.email = User.normalizeEmail(email);

    if (changes.email) {
      const owner = await this.users.findByEmail(changes.email);
      if (owner && owner.id !== userId) {
        throw new UserAlreadyExistsError(changes.email);
      }
    }

    const user = await this.users.update(changes, userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return user;
  }
}

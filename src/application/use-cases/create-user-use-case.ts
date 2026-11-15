import { UseCase } from './core/use-case';
import { CreateUserInput } from './dto/input/create-user-input';
import { User } from '../../domain/entities/user';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists-error';
import { UserRepository } from '../../ports/user-repository';

export class CreateUserUseCase extends UseCase<CreateUserInput, User> {
  constructor(private readonly users: UserRepository) {
    super();
  }

  async execute(input: CreateUserInput): Promise<User> {
    const email = User.normalizeEmail(input.email);

    if (await this.users.findByEmail(email)) {
      throw new UserAlreadyExistsError(email);
    }

    // TODO: gerar o hash da senha antes de salvar
    return this.users.create(User.create({ ...input, email }));
  }
}

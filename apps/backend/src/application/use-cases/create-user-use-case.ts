import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import { CreateUserInput, createUserInputSchema } from './dto/input/create-user-input';
import { CreateUserOutput } from './dto/output/create-user-output';
import { User } from '@/domain/entities/user';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists-error';
import { PasswordHasher } from '@/ports/password-hasher';
import { TokenSigner } from '@/ports/token-signer';
import { UserRepository } from '@/ports/user-repository';

export class CreateUserUseCase extends UseCase<CreateUserInput, CreateUserOutput> {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenSigner,
  ) {
    super();
  }

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    const data = validate(createUserInputSchema, input);
    const email = User.normalizeEmail(data.email);

    if (await this.users.findByEmail(email)) {
      throw new UserAlreadyExistsError(email);
    }

    const user = await this.users.create(
      User.create({
        name: data.name,
        email,
        password: await this.hasher.hash(data.password),
      }),
    );
    const token = await this.tokens.sign({ sub: user.id });

    return { user, token };
  }
}

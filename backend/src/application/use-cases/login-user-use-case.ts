import { UseCase } from './core/use-case';
import { validate } from './core/validate';
import { LoginUserInput, loginUserInputSchema } from './dto/input/login-user-input';
import { LoginUserOutput } from './dto/output/login-user-output';
import { User } from '@/domain/entities/user';
import { InvalidCredentialsError } from '@/domain/errors/invalid-credentials-error';
import { PasswordHasher } from '@/ports/password-hasher';
import { TokenSigner } from '@/ports/token-signer';
import { UserRepository } from '@/ports/user-repository';

export class LoginUserUseCase extends UseCase<LoginUserInput, LoginUserOutput> {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenSigner,
  ) {
    super();
  }

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const { email, password } = validate(loginUserInputSchema, input);

    const user = await this.users.findByEmail(User.normalizeEmail(email));
    const matches =
      user !== null && (await this.hasher.compare(password, user.toSnapshot().password));

    if (!matches) throw new InvalidCredentialsError();

    const token = await this.tokens.sign({ sub: user.id });
    return { user, token };
  }
}

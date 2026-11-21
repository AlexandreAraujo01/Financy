import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InMemoryUserRepository } from '@test/repositories/in-memory-user-repository';
import { FakePasswordHasher } from '@test/cryptography/fake-password-hasher';
import { FakeTokenSigner } from '@test/cryptography/fake-token-signer';
import { User } from '@/domain/entities/user';
import { InvalidCredentialsError } from '@/domain/errors/invalid-credentials-error';
import { InvalidInputError } from '@/domain/errors/invalid-input-error';
import { LoginUserUseCase } from '../login-user-use-case';

const input = { email: 'alex@financy.com', password: 'secret123' };

let userRepo: InMemoryUserRepository;
let hasher: FakePasswordHasher;
let tokenSigner: FakeTokenSigner;
let user: User;
let sut: LoginUserUseCase;

beforeEach(async () => {
  userRepo = new InMemoryUserRepository();
  hasher = new FakePasswordHasher();
  tokenSigner = new FakeTokenSigner();
  user = await userRepo.create(
    User.create({
      name: 'Alex',
      email: input.email,
      password: await hasher.hash(input.password),
    }),
  );
  sut = new LoginUserUseCase(userRepo, hasher, tokenSigner);
});

describe('LoginUserUseCase unit test', () => {
  it('should return the user and a token signed for them', async () => {
    const result = await sut.execute(input);

    expect(result.user).toBe(user);
    await expect(tokenSigner.verify(result.token)).resolves.toEqual({ sub: user.id });
  });

  it('should accept the email with different case and spaces', async () => {
    const result = await sut.execute({ ...input, email: '  ALEX@Financy.com ' });

    expect(result.user).toBe(user);
  });

  it('should throw InvalidCredentialsError for a wrong password', async () => {
    await expect(
      sut.execute({ ...input, password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('should throw the same InvalidCredentialsError for an unknown email', async () => {
    const compare = vi.spyOn(hasher, 'compare');

    await expect(
      sut.execute({ ...input, email: 'nobody@financy.com' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(compare).not.toHaveBeenCalled();
  });

  it('should not sign a token when the credentials are wrong', async () => {
    const sign = vi.spyOn(tokenSigner, 'sign');

    await expect(
      sut.execute({ ...input, password: 'wrong-password' }),
    ).rejects.toThrow(InvalidCredentialsError);
    expect(sign).not.toHaveBeenCalled();
  });

  it.each([
    ['email', { email: 'not-an-email' }],
    ['password', { password: '' }],
  ])('should throw InvalidInputError for an invalid %s', async (path, override) => {
    const error = await sut.execute({ ...input, ...override }).catch((e) => e);

    expect(error).toBeInstanceOf(InvalidInputError);
    expect(error.issues).toEqual([expect.objectContaining({ path })]);
  });
});

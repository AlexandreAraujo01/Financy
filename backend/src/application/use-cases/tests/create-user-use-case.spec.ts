import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InMemoryUserRepository } from '@test/repositories/in-memory-user-repository';
import { InvalidInputError } from '@/domain/errors/invalid-input-error';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists-error';
import { FakePasswordHasher } from '@test/cryptography/fake-password-hasher';
import { FakeTokenSigner } from '@test/cryptography/fake-token-signer';
import { CreateUserUseCase } from '@/application/use-cases/create-user-use-case';

const input = {
  name: 'Alex',
  email: 'alex@financy.com',
  password: 'secret123',
};

let userRepo: InMemoryUserRepository;
let tokenSigner: FakeTokenSigner;
let sut: CreateUserUseCase;

beforeEach(() => {
  userRepo = new InMemoryUserRepository();
  tokenSigner = new FakeTokenSigner();
  sut = new CreateUserUseCase(userRepo, new FakePasswordHasher(), tokenSigner);
});

describe('CreateUserUseCase unit test', () => {
  it('should create and persist a user', async () => {
    const { user } = await sut.execute(input);

    expect(user.toSnapshot()).toMatchObject({
      name: input.name,
      email: input.email,
    });
    expect(userRepo.items.get(user.id)).toBe(user);
  });

  it('should store the hashed password, never the plain one', async () => {
    const { user } = await sut.execute(input);

    expect(user.toSnapshot().password).toBe(`hashed:${input.password}`);
  });

  it('should return a token signed for the new user', async () => {
    const { user, token } = await sut.execute(input);

    await expect(tokenSigner.verify(token)).resolves.toEqual({ sub: user.id });
  });

  it('should normalize the email', async () => {
    const { user } = await sut.execute({ ...input, email: '  ALEX@Financy.com ' });

    expect(user.toSnapshot().email).toBe('alex@financy.com');
  });

  it('should throw UserAlreadyExistsError if the email is taken', async () => {
    await sut.execute(input);

    await expect(
      sut.execute({ ...input, email: ' Alex@Financy.com' }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
    expect(userRepo.items.size).toBe(1);
  });

  it('should not sign a token when the user is not created', async () => {
    await sut.execute(input);
    const sign = vi.spyOn(tokenSigner, 'sign');

    await expect(sut.execute(input)).rejects.toThrow(UserAlreadyExistsError);
    expect(sign).not.toHaveBeenCalled();
  });

  it.each([
    ['name', { name: '   ' }],
    ['email', { email: 'not-an-email' }],
    ['password', { password: 'short' }],
  ])('should throw InvalidInputError for an invalid %s', async (path, override) => {
    const error = await sut.execute({ ...input, ...override }).catch((e) => e);

    expect(error).toBeInstanceOf(InvalidInputError);
    expect(error.issues).toEqual([expect.objectContaining({ path })]);
    expect(userRepo.items.size).toBe(0);
  });

  it('should trim the name', async () => {
    const { user } = await sut.execute({ ...input, name: '  Alex  ' });

    expect(user.toSnapshot().name).toBe('Alex');
  });
});

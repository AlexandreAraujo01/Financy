import { beforeEach, describe, expect, it } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { InMemoryUserRepository } from '@test/repositories/in-memory-user-repository';
import { User } from '@/domain/entities/user';
import { InvalidInputError } from '@/domain/errors/invalid-input-error';
import { UserNotFoundError } from '@/domain/errors/user-not-found-error';
import { FindUserUseCase } from '@/application/use-cases/find-user-use-case';

let userRepo: InMemoryUserRepository;
let sut: FindUserUseCase;

beforeEach(() => {
  userRepo = new InMemoryUserRepository();
  sut = new FindUserUseCase(userRepo);
});

describe('FindUserUseCase unit test', () => {
  it('should return the user', async () => {
    const user = await userRepo.create(
      User.create({ name: 'Alex', email: 'alex@financy.com', password: 'hashed' }),
    );

    await expect(sut.execute({ userId: user.id })).resolves.toBe(user);
  });

  it('should throw UserNotFoundError for an unknown id', async () => {
    await expect(sut.execute({ userId: uuidv7() })).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });

  it('should throw InvalidInputError for an id that is not a uuid', async () => {
    await expect(sut.execute({ userId: '123' })).rejects.toBeInstanceOf(
      InvalidInputError,
    );
  });
});

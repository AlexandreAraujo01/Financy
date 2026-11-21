import { beforeEach, describe, expect, it } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { InMemoryUserRepository } from '@test/repositories/in-memory-user-repository';
import { User } from '@/domain/entities/user';
import { InvalidInputError } from '@/domain/errors/invalid-input-error';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists-error';
import { UserNotFoundError } from '@/domain/errors/user-not-found-error';
import { UpdateUserUseCase } from '@/application/use-cases/update-user-use-case';

let userRepo: InMemoryUserRepository;
let user: User;
let sut: UpdateUserUseCase;

beforeEach(async () => {
  userRepo = new InMemoryUserRepository();
  user = await userRepo.create(
    User.create({ name: 'Alex', email: 'alex@financy.com', password: 'hashed' }),
  );
  sut = new UpdateUserUseCase(userRepo);
});

describe('UpdateUserUseCase unit test', () => {
  it('should update name and normalized email', async () => {
    const updated = await sut.execute({
      userId: user.id,
      name: 'Alexandre',
      email: ' NEW@Financy.com ',
    });

    expect(updated.toSnapshot()).toMatchObject({
      id: user.id,
      name: 'Alexandre',
      email: 'new@financy.com',
      password: 'hashed',
    });
  });

  it('should leave fields sent as null untouched', async () => {
    const updated = await sut.execute({ userId: user.id, name: null, email: null });

    expect(updated.toSnapshot()).toMatchObject({
      name: 'Alex',
      email: 'alex@financy.com',
    });
  });

  it('should allow keeping its own email', async () => {
    await expect(
      sut.execute({ userId: user.id, email: 'alex@financy.com' }),
    ).resolves.toBeInstanceOf(User);
  });

  it('should throw UserAlreadyExistsError if the email belongs to another user', async () => {
    await userRepo.create(
      User.create({ name: 'Bia', email: 'bia@financy.com', password: 'hashed' }),
    );

    await expect(
      sut.execute({ userId: user.id, email: 'bia@financy.com' }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });

  it('should throw UserNotFoundError for an unknown id', async () => {
    await expect(
      sut.execute({ userId: uuidv7(), name: 'Alex' }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('should throw InvalidInputError for an invalid email', async () => {
    await expect(
      sut.execute({ userId: user.id, email: 'not-an-email' }),
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});

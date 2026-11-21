import { uuidv7 } from 'uuidv7';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { env } from '@/env';
import { User } from '@/domain/entities/user';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists-error';
import { createPrismaClient } from '@/infra/database/prisma/prisma';
import { PrismaUserRepository } from '@/infra/database/prisma/repositories/prisma-user-repository';

const makeUser = (email = 'alex@financy.com') =>
  User.create({ name: 'Alex', email, password: 'hashed' });

describe('PrismaUserRepository (e2e)', () => {
  const prisma = createPrismaClient(env.DATABASE_URL);
  const sut = new PrismaUserRepository(prisma);

  beforeEach(() => prisma.user.deleteMany());

  afterAll(() => prisma.$disconnect());

  it('should persist a user and find it by id and email', async () => {
    const user = await sut.create(makeUser());

    const byId = await sut.find(user.id);
    const byEmail = await sut.findByEmail('alex@financy.com');

    expect(byId?.toSnapshot()).toEqual(user.toSnapshot());
    expect(byEmail?.id).toBe(user.id);
  });

  it('should return null for an unknown user', async () => {
    await expect(sut.find(uuidv7())).resolves.toBeNull();
    await expect(sut.findByEmail('nobody@financy.com')).resolves.toBeNull();
  });

  it('should translate a duplicated email into UserAlreadyExistsError', async () => {
    await sut.create(makeUser());

    await expect(sut.create(makeUser())).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });

  it('should update only the given fields', async () => {
    const user = await sut.create(makeUser());

    const updated = await sut.update({ name: 'Alexandre' }, user.id);

    expect(updated?.toSnapshot()).toEqual({ ...user.toSnapshot(), name: 'Alexandre' });
  });

  it('should return the current user when there is nothing to update', async () => {
    const user = await sut.create(makeUser());

    await expect(sut.update({}, user.id)).resolves.toMatchObject({ id: user.id });
  });

  it('should translate an email taken on update into UserAlreadyExistsError', async () => {
    await sut.create(makeUser('bia@financy.com'));
    const user = await sut.create(makeUser());

    await expect(
      sut.update({ email: 'bia@financy.com' }, user.id),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });

  it('should return null when updating or deleting an unknown user', async () => {
    await expect(sut.update({ name: 'X' }, uuidv7())).resolves.toBeNull();
    await expect(sut.delete(uuidv7())).resolves.toBeNull();
  });

  it('should delete and return the user', async () => {
    const user = await sut.create(makeUser());

    await expect(sut.delete(user.id)).resolves.toMatchObject({ id: user.id });
    await expect(sut.find(user.id)).resolves.toBeNull();
  });
});

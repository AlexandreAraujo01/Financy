import { uuidv7 } from 'uuidv7';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { env } from '@/env';
import { Category } from '@/domain/entities/category';
import { User } from '@/domain/entities/user';
import { createPrismaClient } from '@/infra/database/prisma/prisma';
import { PrismaCategoryRepository } from '@/infra/database/prisma/repositories/prisma-category-repository';
import { PrismaUserRepository } from '@/infra/database/prisma/repositories/prisma-user-repository';

describe('PrismaCategoryRepository (e2e)', () => {
  const prisma = createPrismaClient(env.DATABASE_URL);
  const userRepo = new PrismaUserRepository(prisma);
  const sut = new PrismaCategoryRepository(prisma);
  let userId: string;

  const makeCategory = (name = 'Mercado', owner = userId) =>
    Category.create({ description: null, icon: 'utensils', color: 'blue', userId: owner, name, status: 'active' });

  // Apagar os usuários leva as categorias junto (on delete cascade).
  beforeEach(async () => {
    await prisma.user.deleteMany();
    const user = await userRepo.create(
      User.create({ name: 'Alex', email: 'alex@financy.com', password: 'hashed' }),
    );
    userId = user.id;
  });

  afterAll(() => prisma.$disconnect());

  it('should persist a category and find it by id', async () => {
    const category = await sut.create(makeCategory());

    const found = await sut.find(category.id);

    expect(found?.toSnapshot()).toEqual(category.toSnapshot());
  });

  it('should return null for an unknown category', async () => {
    await expect(sut.find(uuidv7())).resolves.toBeNull();
  });

  it('should find an active category by name ignoring case', async () => {
    const category = await sut.create(makeCategory('Mercado'));

    await expect(sut.findActiveByName(userId, 'MERCADO')).resolves.toMatchObject({
      id: category.id,
    });
  });

  it('should not find by name a deleted category or one of another user', async () => {
    const other = await userRepo.create(
      User.create({ name: 'Bia', email: 'bia@financy.com', password: 'hashed' }),
    );
    const deleted = await sut.create(makeCategory('Mercado'));
    await sut.update({ status: 'deleted' }, deleted.id);
    await sut.create(makeCategory('Lazer', other.id));

    await expect(sut.findActiveByName(userId, 'Mercado')).resolves.toBeNull();
    await expect(sut.findActiveByName(userId, 'Lazer')).resolves.toBeNull();
  });

  it('should update only the given fields', async () => {
    const category = await sut.create(makeCategory());

    const updated = await sut.update({ status: 'deleted' }, category.id);

    expect(updated?.toSnapshot()).toEqual({ ...category.toSnapshot(), status: 'deleted' });
  });

  it('should return null when updating or deleting an unknown category', async () => {
    await expect(sut.update({ name: 'X' }, uuidv7())).resolves.toBeNull();
    await expect(sut.delete(uuidv7())).resolves.toBeNull();
  });

  it('should reject a category for a user that does not exist', async () => {
    await expect(sut.create(makeCategory('Mercado', uuidv7()))).rejects.toThrow();
  });

  it('should delete and return the category', async () => {
    const category = await sut.create(makeCategory());

    await expect(sut.delete(category.id)).resolves.toMatchObject({ id: category.id });
    await expect(sut.find(category.id)).resolves.toBeNull();
  });

  it("should list the user's active categories in alphabetical order", async () => {
    const other = await userRepo.create(
      User.create({ name: 'Bia', email: 'bia@financy.com', password: 'hashed' }),
    );
    await sut.create(makeCategory('Mercado'));
    await sut.create(makeCategory('Lazer'));
    const deleted = await sut.create(makeCategory('Antiga'));
    await sut.update({ status: 'deleted' }, deleted.id);
    await sut.create(makeCategory('Contas', other.id));

    const list = await sut.findManyActiveByUser(userId);

    expect(list.map((c) => c.toSnapshot().name)).toEqual(['Lazer', 'Mercado']);
  });

  it('should treat _ and % in the name as plain text, not as wildcards', async () => {
    await sut.create(makeCategory('axb'));
    await sut.create(makeCategory('100% lazer'));

    await expect(sut.findActiveByName(userId, 'a_b')).resolves.toBeNull();
    await expect(sut.findActiveByName(userId, '%')).resolves.toBeNull();
    await expect(sut.findActiveByName(userId, '100% LAZER')).resolves.not.toBeNull();
  });
});

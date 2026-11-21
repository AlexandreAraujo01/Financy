import { uuidv7 } from 'uuidv7';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { env } from '@/env';
import { Category } from '@/domain/entities/category';
import { Transaction } from '@/domain/entities/transaction';
import { User } from '@/domain/entities/user';
import { CategoryNotFoundError } from '@/domain/errors/category-not-found-error';
import { createPrismaClient } from '@/infra/database/prisma/prisma';
import { PrismaCategoryRepository } from '@/infra/database/prisma/repositories/prisma-category-repository';
import { PrismaTransactionRepository } from '@/infra/database/prisma/repositories/prisma-transaction-repository';
import { PrismaUserRepository } from '@/infra/database/prisma/repositories/prisma-user-repository';

describe('PrismaTransactionRepository (e2e)', () => {
  const prisma = createPrismaClient(env.DATABASE_URL);
  const userRepo = new PrismaUserRepository(prisma);
  const categoryRepo = new PrismaCategoryRepository(prisma);
  const sut = new PrismaTransactionRepository(prisma);
  let userA: User;
  let userB: User;
  let categoryA: Category;
  let categoryB: Category;

  const makeTransaction = (userId = userA.id, categoryId = categoryA.id) =>
    Transaction.create({
      userId,
      categoryId,
      type: 'expense',
      date: new Date('2026-11-21T12:00:00.000Z'),
      valueInCents: 15050,
      status: 'active',
    });

  // Apagar os usuários leva categorias e transações junto (on delete cascade).
  beforeEach(async () => {
    await prisma.user.deleteMany();
    userA = await userRepo.create(
      User.create({ name: 'Alex', email: 'alex@financy.com', password: 'hashed' }),
    );
    userB = await userRepo.create(
      User.create({ name: 'Bia', email: 'bia@financy.com', password: 'hashed' }),
    );
    categoryA = await categoryRepo.create(
      Category.create({ userId: userA.id, name: 'Mercado', status: 'active' }),
    );
    categoryB = await categoryRepo.create(
      Category.create({ userId: userB.id, name: 'Mercado', status: 'active' }),
    );
  });

  afterAll(() => prisma.$disconnect());

  it('should persist a transaction and find it by id', async () => {
    const transaction = await sut.create(makeTransaction());

    const found = await sut.find(transaction.id);

    expect(found?.toSnapshot()).toEqual(transaction.toSnapshot());
  });

  it('should return null for an unknown transaction', async () => {
    await expect(sut.find(uuidv7())).resolves.toBeNull();
  });

  it("should reject in the database a transaction of user A with user B's category", async () => {
    await expect(
      sut.create(makeTransaction(userA.id, categoryB.id)),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
    await expect(prisma.transaction.count()).resolves.toBe(0);
  });

  it("should reject in the database moving a transaction to user B's category", async () => {
    const transaction = await sut.create(makeTransaction());

    await expect(
      sut.update({ categoryId: categoryB.id }, transaction.id),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
    expect((await sut.find(transaction.id))?.toSnapshot().categoryId).toBe(categoryA.id);
  });

  it('should update only the given fields', async () => {
    const transaction = await sut.create(makeTransaction());

    const updated = await sut.update({ status: 'deleted', valueInCents: 10 }, transaction.id);

    expect(updated?.toSnapshot()).toEqual({
      ...transaction.toSnapshot(),
      status: 'deleted',
      valueInCents: 10,
    });
  });

  it('should return null when updating or deleting an unknown transaction', async () => {
    await expect(sut.update({ valueInCents: 1 }, uuidv7())).resolves.toBeNull();
    await expect(sut.delete(uuidv7())).resolves.toBeNull();
  });

  it('should not let a category with transactions be removed from the database', async () => {
    await sut.create(makeTransaction());

    await expect(prisma.category.delete({ where: { id: categoryA.id } })).rejects.toThrow();
  });

  it('should remove categories and transactions together when the user is deleted', async () => {
    await sut.create(makeTransaction());

    await prisma.user.delete({ where: { id: userA.id } });

    await expect(prisma.transaction.count()).resolves.toBe(0);
    await expect(prisma.category.count({ where: { userId: userA.id } })).resolves.toBe(0);
  });

  it("should list the user's active transactions, newest first", async () => {
    const at = (date: string, valueInCents: number) =>
      Transaction.create({ ...makeTransaction().toSnapshot(), date: new Date(date), valueInCents });
    await sut.create(at('2026-11-01T00:00:00.000Z', 100));
    await sut.create(at('2026-11-20T00:00:00.000Z', 200));
    const deleted = await sut.create(at('2026-11-30T00:00:00.000Z', 300));
    await sut.update({ status: 'deleted' }, deleted.id);
    await sut.create(makeTransaction(userB.id, categoryB.id));

    const list = await sut.findManyActiveByUser(userA.id);

    expect(list.map((t) => t.toSnapshot().valueInCents)).toEqual([200, 100]);
  });
});

import { uuidv7 } from 'uuidv7';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { FixedClock } from '@test/clock/fixed-clock';
import { env } from '@/env';
import { RecurringTransactionsGenerator } from '@/application/services/recurring-transactions-generator';
import { Category } from '@/domain/entities/category';
import { RecurringTransaction } from '@/domain/entities/recurring-transaction';
import { Transaction } from '@/domain/entities/transaction';
import { User } from '@/domain/entities/user';
import { CategoryNotFoundError } from '@/domain/errors/category-not-found-error';
import { createPrismaClient } from '@/infra/database/prisma/prisma';
import { PrismaCategoryRepository } from '@/infra/database/prisma/repositories/prisma-category-repository';
import { PrismaRecurringTransactionRepository } from '@/infra/database/prisma/repositories/prisma-recurring-transaction-repository';
import { PrismaTransactionRepository } from '@/infra/database/prisma/repositories/prisma-transaction-repository';
import { PrismaUserRepository } from '@/infra/database/prisma/repositories/prisma-user-repository';

const day = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

describe('PrismaRecurringTransactionRepository (e2e)', () => {
  const prisma = createPrismaClient(env.DATABASE_URL);
  const userRepo = new PrismaUserRepository(prisma);
  const categoryRepo = new PrismaCategoryRepository(prisma);
  const transactionRepo = new PrismaTransactionRepository(prisma);
  const sut = new PrismaRecurringTransactionRepository(prisma);
  let userA: User;
  let categoryA: Category;
  let categoryB: Category;

  const makeRecurrence = (categoryId = categoryA.id, nextDueDate = day('2026-09-05')) =>
    RecurringTransaction.create({
      userId: userA.id,
      categoryId,
      description: 'Salário',
      type: 'income',
      valueInCents: 500000,
      dayOfMonth: 5,
      startDate: day('2026-09-01'),
      nextDueDate,
      status: 'active',
    });

  const makeCategory = (userId: string) =>
    Category.create({
      userId,
      name: 'Salário',
      description: null,
      icon: 'briefcase_business',
      color: 'green',
      status: 'active',
    });

  // Apagar os usuários leva categorias, recorrências e transações junto (on delete cascade).
  beforeEach(async () => {
    await prisma.user.deleteMany();
    userA = await userRepo.create(User.create({ name: 'Alex', email: 'alex@financy.com', password: 'x' }));
    const userB = await userRepo.create(User.create({ name: 'Bia', email: 'bia@financy.com', password: 'x' }));
    categoryA = await categoryRepo.create(makeCategory(userA.id));
    categoryB = await categoryRepo.create(makeCategory(userB.id));
  });

  afterAll(() => prisma.$disconnect());

  it('should persist a recurrence and list it while active', async () => {
    const recurrence = await sut.create(makeRecurrence());

    expect((await sut.find(recurrence.id))?.toSnapshot()).toEqual(recurrence.toSnapshot());
    await expect(sut.findManyActiveByUser(userA.id)).resolves.toHaveLength(1);

    await sut.update({ status: 'ended' }, recurrence.id);

    await expect(sut.findManyActiveByUser(userA.id)).resolves.toHaveLength(0);
  });

  it('should persist business days and generate the holiday-adjusted dates once', async () => {
    const recurrence = await sut.create(RecurringTransaction.create({
      ...makeRecurrence().toSnapshot(), dayType: 'business_day', nextDueDate: day('2026-09-08'),
    }));
    expect((await sut.find(recurrence.id))?.toSnapshot().dayType).toBe('business_day');
    const generator = new RecurringTransactionsGenerator(sut, transactionRepo, new FixedClock(day('2026-11-21')));
    await Promise.all(Array.from({ length: 5 }, () => generator.generateDue()));
    const rows = await prisma.transaction.findMany({ orderBy: { date: 'asc' } });
    expect(rows.map(row => row.date.toISOString().slice(0, 10))).toEqual([
      '2026-09-08', '2026-10-07', '2026-11-09',
    ]);
    expect((await sut.find(recurrence.id))?.toSnapshot().nextDueDate).toEqual(day('2026-12-07'));
  });

  it('should enforce the business-day limit in the database', async () => {
    const recurrence = await sut.create(makeRecurrence());
    await expect(prisma.recurringTransaction.update({
      where: { id: recurrence.id }, data: { dayType: 'business_day', dayOfMonth: 24 },
    })).rejects.toThrow();
    expect((await sut.find(recurrence.id))?.toSnapshot()).toMatchObject({ dayType: 'calendar_day', dayOfMonth: 5 });
  });

  it('should paginate only active recurrences due today or earlier across all users', async () => {
    const overdue = await sut.create(makeRecurrence(categoryA.id, day('2026-11-20')));
    const todayA = await sut.create(makeRecurrence(categoryA.id, day('2026-11-21')));
    const todayB = await sut.create(RecurringTransaction.create({
      ...makeRecurrence(categoryB.id, day('2026-11-21')).toSnapshot(),
      userId: categoryB.toSnapshot().userId,
    }));
    await sut.create(makeRecurrence(categoryA.id, day('2026-11-22')));
    const ended = await sut.create(makeRecurrence(categoryA.id, day('2026-11-20')));
    await sut.update({ status: 'ended' }, ended.id);

    const first = await sut.findManyDue(day('2026-11-21'), 2);
    expect(first).toHaveLength(2);
    expect(first[0]?.id).toBe(overdue.id);
    const last = first[1]!;
    const second = await sut.findManyDue(day('2026-11-21'), 2, {
      id: last.id, nextDueDate: last.toSnapshot().nextDueDate,
    });
    expect(second).toHaveLength(1);
    expect([...first, ...second].map(recurrence => recurrence.id).sort())
      .toEqual([overdue.id, todayA.id, todayB.id].sort());
  });

  it("should reject in the database a recurrence with another user's category", async () => {
    await expect(sut.create(makeRecurrence(categoryB.id))).rejects.toBeInstanceOf(
      CategoryNotFoundError,
    );
  });

  it('should reject a day of month outside 1..31 in the database', async () => {
    const recurrence = await sut.create(makeRecurrence());

    await expect(
      prisma.recurringTransaction.update({ where: { id: recurrence.id }, data: { dayOfMonth: 32 } }),
    ).rejects.toThrow();
  });

  it('should refuse the same recurrence day twice and report it with false', async () => {
    const recurrence = await sut.create(makeRecurrence());
    const [dueDate] = recurrence.dueDates(day('2026-09-05'));
    const transaction = {
      userId: userA.id,
      categoryId: categoryA.id,
      description: 'Salário',
      type: 'income' as const,
      valueInCents: 500000,
      date: dueDate!,
      status: 'active' as const,
      recurringTransactionId: recurrence.id,
    };

    await expect(transactionRepo.createFromRecurrence(Transaction.create(transaction))).resolves.toBe(true);
    await expect(transactionRepo.createFromRecurrence(Transaction.create(transaction))).resolves.toBe(false);
    await expect(prisma.transaction.count()).resolves.toBe(1);
  });

  it('should generate each month once even with simultaneous requests', async () => {
    await sut.create(makeRecurrence());
    const generator = new RecurringTransactionsGenerator(
      sut,
      transactionRepo,
      new FixedClock(day('2026-11-21')),
    );

    await Promise.all(Array.from({ length: 5 }, () => generator.generateDue()));

    const dates = (await prisma.transaction.findMany({ orderBy: { date: 'asc' } })).map((t) =>
      t.date.toISOString().slice(0, 10),
    );
    expect(dates).toEqual(['2026-09-05', '2026-10-05', '2026-11-05']);
  });

  it('should keep the generated transactions when the user ends the recurrence', async () => {
    const recurrence = await sut.create(makeRecurrence());
    const generator = new RecurringTransactionsGenerator(
      sut,
      transactionRepo,
      new FixedClock(day('2026-11-21')),
    );
    await generator.generateDue();

    await sut.update({ status: 'ended' }, recurrence.id);

    await expect(transactionRepo.findManyActiveByUser(userA.id)).resolves.toHaveLength(3);
  });
});

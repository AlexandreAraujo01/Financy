import { beforeEach, describe, expect, it } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { FixedClock } from '@test/clock/fixed-clock';
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category-repository';
import { InMemoryRecurringTransactionRepository } from '@test/repositories/in-memory-recurring-transaction-repository';
import { InMemoryTransactionRepository } from '@test/repositories/in-memory-transaction-repository';
import { RecurringTransactionsGenerator } from '@/application/services/recurring-transactions-generator';
import { Category } from '@/domain/entities/category';
import { RecurringTransaction } from '@/domain/entities/recurring-transaction';
import { CategoryNotFoundError } from '@/domain/errors/category-not-found-error';
import { InvalidInputError } from '@/domain/errors/invalid-input-error';
import { RecurringTransactionNotFoundError } from '@/domain/errors/recurring-transaction-not-found-error';
import { CreateRecurringTransactionUseCase } from '../create-recurring-transaction-use-case';
import { EndRecurringTransactionUseCase } from '../end-recurring-transaction-use-case';
import { ListRecurringTransactionsUseCase } from '../list-recurring-transactions-use-case';
import { UpdateRecurringTransactionUseCase } from '../update-recurring-transaction-use-case';

const userA = uuidv7();
const userB = uuidv7();
const day = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

let recurrenceRepo: InMemoryRecurringTransactionRepository;
let transactionRepo: InMemoryTransactionRepository;
let categoryRepo: InMemoryCategoryRepository;
let categoryA: Category;
let categoryB: Category;
let createSut: CreateRecurringTransactionUseCase;
let updateSut: UpdateRecurringTransactionUseCase;
let endSut: EndRecurringTransactionUseCase;
let listSut: ListRecurringTransactionsUseCase;

const createCategory = (userId: string) =>
  categoryRepo.create(
    Category.create({
      userId,
      name: 'Assinaturas',
      description: null,
      icon: 'ticket',
      color: 'pink',
      status: 'active',
    }),
  );

const input = () => ({
  userId: userA,
  categoryId: categoryA.id,
  description: 'Netflix',
  type: 'expense' as const,
  valueInCents: 5590,
  dayOfMonth: 25,
  startDate: '2026-11-21T12:00:00.000Z',
});

beforeEach(async () => {
  recurrenceRepo = new InMemoryRecurringTransactionRepository();
  transactionRepo = new InMemoryTransactionRepository();
  categoryRepo = new InMemoryCategoryRepository();
  categoryA = await createCategory(userA);
  categoryB = await createCategory(userB);
  const generator = new RecurringTransactionsGenerator(
    recurrenceRepo,
    transactionRepo,
    new FixedClock(day('2026-11-21')),
  );
  createSut = new CreateRecurringTransactionUseCase(recurrenceRepo, categoryRepo, generator);
  updateSut = new UpdateRecurringTransactionUseCase(recurrenceRepo, categoryRepo);
  endSut = new EndRecurringTransactionUseCase(recurrenceRepo);
  listSut = new ListRecurringTransactionsUseCase(recurrenceRepo);
});

describe('CreateRecurringTransactionUseCase unit test', () => {
  it('should generate past business days with national holidays and keep the next date', async () => {
    const recurrence = await createSut.execute({
      ...input(), dayOfMonth: 5, dayType: 'business_day', startDate: '2026-09-01T12:00:00.000Z',
    });
    expect([...transactionRepo.items.values()].map(t => t.toSnapshot().date)).toEqual([
      day('2026-09-08'), day('2026-10-07'), day('2026-11-09'),
    ]);
    expect(recurrence.toSnapshot()).toMatchObject({ dayType: 'business_day', nextDueDate: day('2026-12-07') });
  });

  it('should reject a business day above 23 without persisting', async () => {
    await expect(createSut.execute({ ...input(), dayType: 'business_day', dayOfMonth: 24 }))
      .rejects.toBeInstanceOf(InvalidInputError);
    expect(recurrenceRepo.items.size).toBe(0);
    expect(transactionRepo.items.size).toBe(0);
  });

  it('should reject an unknown day type', async () => {
    await expect(createSut.execute({ ...input(), dayType: 'unknown' as 'business_day' }))
      .rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should schedule the first occurrence on the chosen day without generating it early', async () => {
    const recurrence = await createSut.execute(input());

    expect(recurrence.toSnapshot()).toMatchObject({
      description: 'Netflix',
      dayOfMonth: 25,
      status: 'active',
      nextDueDate: day('2026-11-25'),
    });
    expect(transactionRepo.items.size).toBe(0);
  });

  it('should generate right away when the first occurrence is today', async () => {
    const recurrence = await createSut.execute({ ...input(), dayOfMonth: 21 });

    expect(transactionRepo.items.size).toBe(1);
    expect(recurrence.toSnapshot().nextDueDate).toEqual(day('2026-12-21'));
  });

  it('should generate the past months when it starts in the past', async () => {
    await createSut.execute({ ...input(), dayOfMonth: 5, startDate: '2026-09-01T12:00:00.000Z' });

    expect(transactionRepo.items.size).toBe(3);
  });

  it("should throw CategoryNotFoundError for another user's category", async () => {
    await expect(
      createSut.execute({ ...input(), categoryId: categoryB.id }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
    expect(recurrenceRepo.items.size).toBe(0);
  });

  it.each([
    ['dayOfMonth', { dayOfMonth: 0 }],
    ['dayOfMonth', { dayOfMonth: 32 }],
    ['dayOfMonth', { dayOfMonth: 1.5 }],
    ['valueInCents', { valueInCents: 0 }],
    ['description', { description: ' ' }],
  ])('should throw InvalidInputError for an invalid %s', async (path, override) => {
    const error = await createSut.execute({ ...input(), ...override }).catch((e) => e);

    expect(error).toBeInstanceOf(InvalidInputError);
    expect(error.issues).toEqual([expect.objectContaining({ path })]);
  });
});

describe('UpdateRecurringTransactionUseCase unit test', () => {
  let recurrence: RecurringTransaction;

  beforeEach(async () => {
    recurrence = await createSut.execute(input());
  });

  it('should switch to business days without scheduling before the start date', async () => {
    const updated = await updateSut.execute({
      userId: userA, recurringTransactionId: recurrence.id, dayOfMonth: 5, dayType: 'business_day',
    });
    expect(updated.toSnapshot()).toMatchObject({ dayType: 'business_day', dayOfMonth: 5, nextDueDate: day('2026-12-07') });
  });

  it('should validate the saved day when only the day type is changed', async () => {
    await expect(updateSut.execute({ userId: userA, recurringTransactionId: recurrence.id, dayType: 'business_day' }))
      .rejects.toBeInstanceOf(InvalidInputError);
    expect((await recurrenceRepo.find(recurrence.id))?.toSnapshot()).toEqual(recurrence.toSnapshot());
  });

  it('should validate the saved business-day type on a partial day update', async () => {
    const business = await createSut.execute({ ...input(), dayOfMonth: 5, dayType: 'business_day' });
    await expect(updateSut.execute({ userId: userA, recurringTransactionId: business.id, dayOfMonth: 31 }))
      .rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should switch back to a calendar day without changing generated transactions', async () => {
    const business = await createSut.execute({
      ...input(), dayOfMonth: 5, dayType: 'business_day', startDate: '2026-11-01T12:00:00.000Z',
    });
    const history = [...transactionRepo.items.values()].map(t => t.toSnapshot());
    const updated = await updateSut.execute({
      userId: userA, recurringTransactionId: business.id, dayType: 'calendar_day',
    });
    expect(updated.toSnapshot().nextDueDate).toEqual(day('2026-12-05'));
    expect([...transactionRepo.items.values()].map(t => t.toSnapshot())).toEqual(history);
  });

  it('should update the fields for the next months', async () => {
    const updated = await updateSut.execute({
      userId: userA,
      recurringTransactionId: recurrence.id,
      description: 'Netflix Premium',
      valueInCents: 5990,
    });

    expect(updated.toSnapshot()).toMatchObject({
      description: 'Netflix Premium',
      valueInCents: 5990,
      nextDueDate: day('2026-11-25'),
    });
  });

  it('should move the next date to the new day in the same month', async () => {
    const updated = await updateSut.execute({
      userId: userA,
      recurringTransactionId: recurrence.id,
      dayOfMonth: 30,
    });

    expect(updated.toSnapshot()).toMatchObject({ dayOfMonth: 30, nextDueDate: day('2026-11-30') });
  });

  it("should throw CategoryNotFoundError when moving to another user's category", async () => {
    await expect(
      updateSut.execute({ userId: userA, recurringTransactionId: recurrence.id, categoryId: categoryB.id }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it('should throw RecurringTransactionNotFoundError for another user', async () => {
    await expect(
      updateSut.execute({ userId: userB, recurringTransactionId: recurrence.id, valueInCents: 1 }),
    ).rejects.toBeInstanceOf(RecurringTransactionNotFoundError);
  });
});

describe('EndRecurringTransactionUseCase unit test', () => {
  it('should stop the recurrence and keep what was already generated', async () => {
    const recurrence = await createSut.execute({ ...input(), dayOfMonth: 21 });

    const ended = await endSut.execute({ userId: userA, recurringTransactionId: recurrence.id });

    expect(ended.isActive).toBe(false);
    expect(transactionRepo.items.size).toBe(1);
  });

  it('should throw RecurringTransactionNotFoundError when ending twice or for another user', async () => {
    const recurrence = await createSut.execute(input());
    await expect(
      endSut.execute({ userId: userB, recurringTransactionId: recurrence.id }),
    ).rejects.toBeInstanceOf(RecurringTransactionNotFoundError);

    await endSut.execute({ userId: userA, recurringTransactionId: recurrence.id });

    await expect(
      endSut.execute({ userId: userA, recurringTransactionId: recurrence.id }),
    ).rejects.toBeInstanceOf(RecurringTransactionNotFoundError);
  });
});

describe('ListRecurringTransactionsUseCase unit test', () => {
  it("should list only the user's active recurrences", async () => {
    const kept = await createSut.execute(input());
    const ended = await createSut.execute({ ...input(), description: 'Spotify' });
    await endSut.execute({ userId: userA, recurringTransactionId: ended.id });

    const list = await listSut.execute({ userId: userA });

    expect(list.map((r) => r.id)).toEqual([kept.id]);
    await expect(listSut.execute({ userId: userB })).resolves.toEqual([]);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { FixedClock } from '@test/clock/fixed-clock';
import { InMemoryRecurringTransactionRepository } from '@test/repositories/in-memory-recurring-transaction-repository';
import { InMemoryTransactionRepository } from '@test/repositories/in-memory-transaction-repository';
import { RecurringTransaction } from '@/domain/entities/recurring-transaction';
import { RecurringTransactionsGenerator } from '../recurring-transactions-generator';

const userId = uuidv7();
const day = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

let recurrenceRepo: InMemoryRecurringTransactionRepository;
let transactionRepo: InMemoryTransactionRepository;
let clock: FixedClock;
let sut: RecurringTransactionsGenerator;

const createRecurrence = (overrides: Partial<{ dayOfMonth: number; nextDueDate: Date; userId: string; dayType: 'calendar_day' | 'business_day' }> = {}) =>
  recurrenceRepo.create(
    RecurringTransaction.create({
      userId,
      categoryId: uuidv7(),
      description: 'Salário',
      type: 'income',
      valueInCents: 500000,
      dayOfMonth: 5,
      startDate: day('2026-09-01'),
      nextDueDate: day('2026-09-05'),
      status: 'active',
      ...overrides,
    }),
  );

const generatedDates = () =>
  [...transactionRepo.items.values()]
    .map((t) => t.toSnapshot().date.toISOString().slice(0, 10))
    .sort();

beforeEach(() => {
  recurrenceRepo = new InMemoryRecurringTransactionRepository();
  transactionRepo = new InMemoryTransactionRepository();
  clock = new FixedClock(day('2026-11-21'));
  sut = new RecurringTransactionsGenerator(recurrenceRepo, transactionRepo, clock);
});

afterEach(() => vi.restoreAllMocks());

describe('RecurringTransactionsGenerator unit test', () => {
  it('should generate business days once, wait until due, and advance to the next year', async () => {
    const recurrence = await createRecurrence({ dayType: 'business_day', nextDueDate: day('2026-09-08') });
    await sut.generateDue();
    await sut.generateDue();
    expect(generatedDates()).toEqual(['2026-09-08', '2026-10-07', '2026-11-09']);
    expect((await recurrenceRepo.find(recurrence.id))?.toSnapshot().nextDueDate).toEqual(day('2026-12-07'));
    clock.set(day('2026-12-06'));
    await sut.generateDue();
    expect(transactionRepo.items.size).toBe(3);
    clock.set(day('2026-12-07'));
    await sut.generateDue();
    expect(generatedDates()).toEqual(['2026-09-08', '2026-10-07', '2026-11-09', '2026-12-07']);
    expect((await recurrenceRepo.find(recurrence.id))?.toSnapshot().nextDueDate).toEqual(day('2027-01-08'));
  });
  it('should create one transaction per missed month, copying the recurrence', async () => {
    const recurrence = await createRecurrence();

    await sut.generateDue();

    expect(generatedDates()).toEqual(['2026-09-05', '2026-10-05', '2026-11-05']);
    const [first] = transactionRepo.items.values();
    expect(first?.toSnapshot()).toMatchObject({
      userId,
      description: 'Salário',
      type: 'income',
      valueInCents: 500000,
      status: 'active',
      recurringTransactionId: recurrence.id,
    });
  });

  it('should move the next date to the month after the last generated one', async () => {
    const recurrence = await createRecurrence();

    await sut.generateDue();

    expect(recurrenceRepo.items.get(recurrence.id)?.toSnapshot().nextDueDate).toEqual(
      day('2026-12-05'),
    );
  });

  it('should not generate anything twice when run again', async () => {
    await createRecurrence();

    await sut.generateDue();
    await sut.generateDue();

    expect(transactionRepo.items.size).toBe(3);
  });

  it('should not duplicate a day that was generated but whose pointer did not move', async () => {
    // Simula duas requisições juntas: a segunda ainda vê a recorrência antiga.
    const recurrence = await createRecurrence();
    await sut.generate(recurrence);

    await sut.generate(recurrence);

    expect(transactionRepo.items.size).toBe(3);
  });

  it('should not bring back a generated month that the user deleted', async () => {
    await createRecurrence();
    await sut.generateDue();
    const [first] = transactionRepo.items.values();
    await transactionRepo.update({ status: 'deleted' }, first!.id);
    await recurrenceRepo.update({ nextDueDate: day('2026-09-05') }, [...recurrenceRepo.items.keys()][0]!);

    await sut.generateDue();

    expect(transactionRepo.items.size).toBe(3);
  });

  it('should pick up the next month when the day arrives', async () => {
    await createRecurrence();
    await sut.generateDue();

    clock.set(day('2026-12-05'));
    await sut.generateDue();

    expect(generatedDates()).toEqual(['2026-09-05', '2026-10-05', '2026-11-05', '2026-12-05']);
  });

  it('should process due recurrences of every user and ignore ended or future ones', async () => {
    const otherUserId = uuidv7();
    const other = await createRecurrence({ userId: otherUserId });
    const ended = await createRecurrence();
    await recurrenceRepo.update({ status: 'ended' }, ended.id);
    await createRecurrence({ nextDueDate: day('2026-12-05') });

    await expect(sut.generateDue()).resolves.toEqual({ processed: 1, failed: 0 });

    expect(transactionRepo.items.size).toBe(3);
    expect([...transactionRepo.items.values()].every(t => t.toSnapshot().userId === otherUserId)).toBe(true);
    expect((await recurrenceRepo.find(other.id))?.toSnapshot().nextDueDate).toEqual(day('2026-12-05'));
  });

  it('should process due dates in multiple batches without skipping records as dates advance', async () => {
    for (let index = 0; index < 205; index++) {
      await createRecurrence({ nextDueDate: day('2026-11-05') });
    }
    const findDue = vi.spyOn(recurrenceRepo, 'findManyDue');
    await expect(sut.generateDue()).resolves.toEqual({ processed: 205, failed: 0 });
    expect(transactionRepo.items.size).toBe(205);
    expect(findDue).toHaveBeenCalledTimes(4);
    expect(findDue.mock.calls.every(([cutoff, limit]) => cutoff.getTime() === day('2026-11-21').getTime() && limit === 100)).toBe(true);
  });

  it('should include today before noon and exclude tomorrow until the day changes in Sao Paulo', async () => {
    await createRecurrence({ dayOfMonth: 22, nextDueDate: day('2026-11-22') });
    clock.set(new Date('2026-11-22T02:59:59.000Z')); // Ainda é dia 21 no Brasil.
    await expect(sut.generateDue()).resolves.toEqual({ processed: 0, failed: 0 });
    clock.set(new Date('2026-11-22T04:00:00.000Z')); // 01:00 do dia 22 no Brasil.
    await expect(sut.generateDue()).resolves.toEqual({ processed: 1, failed: 0 });
    expect(generatedDates()).toEqual(['2026-11-22']);
  });

  it('should continue past failed records and retry partial writes without duplicating them', async () => {
    const broken = await createRecurrence();
    const healthy = await createRecurrence();
    const original = transactionRepo.createFromRecurrence.bind(transactionRepo);
    let failed = false;
    const failure = new Error('temporary database failure');
    vi.spyOn(transactionRepo, 'createFromRecurrence').mockImplementation(async transaction => {
      const snapshot = transaction.toSnapshot();
      if (!failed && snapshot.recurringTransactionId === broken.id && snapshot.date.getUTCMonth() === 9) {
        failed = true;
        throw failure;
      }
      return original(transaction);
    });
    const onError = vi.fn();
    await expect(sut.generateDue(onError)).resolves.toEqual({ processed: 1, failed: 1 });
    expect(onError).toHaveBeenCalledWith(failure, broken.id);
    expect((await recurrenceRepo.find(healthy.id))?.toSnapshot().nextDueDate).toEqual(day('2026-12-05'));
    expect((await recurrenceRepo.find(broken.id))?.toSnapshot().nextDueDate).toEqual(day('2026-09-05'));
    await expect(sut.generateDue(onError)).resolves.toEqual({ processed: 1, failed: 0 });
    expect(transactionRepo.items.size).toBe(6);
    expect((await recurrenceRepo.find(broken.id))?.toSnapshot().nextDueDate).toEqual(day('2026-12-05'));
  });

  it('should move past full batches of failed records instead of retrying forever in the same run', async () => {
    for (let index = 0; index < 101; index++) await createRecurrence();
    vi.spyOn(transactionRepo, 'createFromRecurrence').mockRejectedValue(new Error('unavailable'));
    const onError = vi.fn();
    await expect(sut.generateDue(onError)).resolves.toEqual({ processed: 0, failed: 101 });
    expect(onError).toHaveBeenCalledTimes(101);
    expect(transactionRepo.items.size).toBe(0);
  });
});

import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { InMemoryRecurringTransactionRepository } from '@test/repositories/in-memory-recurring-transaction-repository';
import { InMemoryTransactionRepository } from '@test/repositories/in-memory-transaction-repository';
import { RecurringTransactionsGenerator } from '@/application/services/recurring-transactions-generator';
import { RecurringTransaction } from '@/domain/entities/recurring-transaction';
import { SystemClock } from '@/infra/clock/system-clock';
import { registerRecurringTransactionsJob } from '../recurring-transactions-job';

let app: FastifyInstance;
let recurrences: InMemoryRecurringTransactionRepository;
let transactions: InMemoryTransactionRepository;
let generator: RecurringTransactionsGenerator;
const day = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

async function seed(nextDueDate: string, dayOfMonth = 22) {
  return recurrences.create(RecurringTransaction.create({
    userId: uuidv7(), categoryId: uuidv7(), description: 'Salário', type: 'income',
    valueInCents: 10000, status: 'active', dayOfMonth,
    startDate: day('2026-10-01'), nextDueDate: day(nextDueDate),
  }));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
  vi.setSystemTime(new Date('2026-11-22T03:59:59.000Z'));
  app = Fastify();
  recurrences = new InMemoryRecurringTransactionRepository();
  transactions = new InMemoryTransactionRepository();
  generator = new RecurringTransactionsGenerator(recurrences, transactions, new SystemClock());
});

afterEach(async () => {
  await app.close();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Recurring transactions daily job', () => {
  it('runs at 01:00 Sao Paulo, picks up today and past dates, and leaves future dates alone', async () => {
    const due = await seed('2026-11-22');
    await seed('2026-10-21', 21);
    const future = await seed('2026-11-23', 23);
    registerRecurringTransactionsJob(app, generator);
    await app.ready();
    expect(transactions.items.size).toBe(0);
    await vi.advanceTimersByTimeAsync(999);
    expect(transactions.items.size).toBe(0);
    await vi.advanceTimersByTimeAsync(2);
    expect(transactions.items.size).toBe(3);
    expect((await recurrences.find(due.id))?.toSnapshot().nextDueDate).toEqual(day('2026-12-22'));
    expect((await recurrences.find(future.id))?.toSnapshot().nextDueDate).toEqual(day('2026-11-23'));
  });

  it('logs a failure and still executes on the following day', async () => {
    const generate = vi.spyOn(generator, 'generateDue').mockRejectedValueOnce(new Error('database offline'));
    const error = vi.spyOn(app.log, 'error');
    await seed('2026-11-22');
    registerRecurringTransactionsJob(app, generator);
    await app.ready();
    await vi.advanceTimersByTimeAsync(1001);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalled();
    expect(transactions.items.size).toBe(0);
    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(transactions.items.size).toBe(1);
  });

  it('stops scheduling when the server closes', async () => {
    const generate = vi.spyOn(generator, 'generateDue');
    registerRecurringTransactionsJob(app, generator);
    await app.ready();
    await app.close();
    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
    expect(generate).not.toHaveBeenCalled();
  });

  it('does not overlap jobs and waits for in-flight generation before closing', async () => {
    let release!: (result: { processed: number; failed: number }) => void;
    const pending = new Promise<{ processed: number; failed: number }>(resolve => { release = resolve; });
    const generate = vi.spyOn(generator, 'generateDue').mockReturnValue(pending);
    const disconnect = vi.fn();
    // O hook de desconexão do banco é registrado antes do job no bootstrap.
    app.addHook('onClose', async () => { disconnect(); });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerRecurringTransactionsJob(app, generator);
    await app.ready();
    await vi.advanceTimersByTimeAsync(1001);
    expect(generate).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
    expect(generate).toHaveBeenCalledTimes(1);
    let closed = false;
    const closing = app.close().then(() => { closed = true; });
    await new Promise(resolve => setImmediate(resolve));
    expect(closed).toBe(false);
    expect(disconnect).not.toHaveBeenCalled();
    release({ processed: 1, failed: 0 });
    await closing;
    expect(closed).toBe(true);
    expect(disconnect).toHaveBeenCalledOnce();
  });
});

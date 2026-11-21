import { describe, expect, it } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { Transaction } from '../transaction';

const props = {
  userId: uuidv7(),
  categoryId: uuidv7(),
  date: new Date('2026-11-21T12:00:00.000Z'),
  valueInCents: 15050,
  status: 'active' as const,
};

describe('Transaction unit test', () => {
  it('should keep the value positive for an income', () => {
    const transaction = Transaction.create({ ...props, type: 'income' });

    expect(transaction.signedValueInCents).toBe(15050);
  });

  it('should make the value negative for an expense', () => {
    const transaction = Transaction.create({ ...props, type: 'expense' });

    expect(transaction.signedValueInCents).toBe(-15050);
  });

  it('should compute a balance by summing the signed values', () => {
    const balance = [
      Transaction.create({ ...props, type: 'income', valueInCents: 500000 }),
      Transaction.create({ ...props, type: 'expense', valueInCents: 15050 }),
      Transaction.create({ ...props, type: 'expense', valueInCents: 10 }),
    ].reduce((total, t) => total + t.signedValueInCents, 0);

    expect(balance).toBe(484940);
  });

  it('should be active only when the status is active', () => {
    expect(Transaction.create({ ...props, type: 'income' }).isActive).toBe(true);
    expect(
      Transaction.create({ ...props, type: 'income', status: 'deleted' }).isActive,
    ).toBe(false);
  });
});

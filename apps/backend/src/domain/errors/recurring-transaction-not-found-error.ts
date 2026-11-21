export class RecurringTransactionNotFoundError extends Error {
  constructor(id: string) {
    super(`Recurring transaction not found`);
    this.name = 'RecurringTransactionNotFoundError';
  }
}

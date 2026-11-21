export class TransactionNotFoundError extends Error {
  constructor(id: string) {
    super(`Transaction not found`);
    this.name = 'TransactionNotFoundError';
  }
}

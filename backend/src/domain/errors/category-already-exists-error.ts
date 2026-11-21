export class CategoryAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Category already exists`);
    this.name = 'CategoryAlreadyExistsError';
  }
}

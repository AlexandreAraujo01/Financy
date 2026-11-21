export class CategoryNotFoundError extends Error {
  constructor(id: string) {
    super(`Category not found`);
    this.name = 'CategoryNotFoundError';
  }
}

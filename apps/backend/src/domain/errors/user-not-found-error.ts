export class UserNotFoundError extends Error {
  constructor(id: string) {
    super(`User  not found`);
    this.name = 'UserNotFoundError';
  }
}

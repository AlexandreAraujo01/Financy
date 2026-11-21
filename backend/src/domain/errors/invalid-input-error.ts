export interface InputIssue {
  path: string;
  message: string;
}

export class InvalidInputError extends Error {
  constructor(public readonly issues: InputIssue[]) {
    super(`Invalid input`);
    this.name = 'InvalidInputError';
  }
}

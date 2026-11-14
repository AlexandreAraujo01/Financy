import { Entity } from '../core/entity';
import { IUser } from './props/user/user';

export class User extends Entity<IUser> {
  protected constructor(data: IUser, id?: string, createdAt?: Date) {
    super(data, id, createdAt);
  }

  static create(data: IUser, id?: string, createdAt?: Date) {
    return new User(
      { ...data, email: User.normalizeEmail(data.email) },
      id,
      createdAt,
    );
  }

  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}

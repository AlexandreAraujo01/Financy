import { User } from '../domain/entities/user';
import { IUser } from '../domain/entities/props/user/user';
import { Repository } from './repository';

export abstract class UserRepository extends Repository<User, IUser> {
  abstract findByEmail(email: string): Promise<User | null>;
}

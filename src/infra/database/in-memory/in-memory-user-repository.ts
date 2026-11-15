import { User } from '../../../domain/entities/user';
import { IUser } from '../../../domain/entities/props/user/user';
import { UserRepository } from '../../../ports/user-repository';
import { InMemoryRepository } from './in-memory-repository';

export class InMemoryUserRepository
  extends InMemoryRepository<User, IUser>
  implements UserRepository
{
  findByEmail(email: string): Promise<User | null> {
    const user = [...this.items.values()].find(
      (user) => user.toSnapshot().email === email,
    );
    return Promise.resolve(user ?? null);
  }

  protected build(props: IUser, id: string, createdAt: Date): User {
    return User.create(props, id, createdAt);
  }
}

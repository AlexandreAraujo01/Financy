import { User } from '@/domain/entities/user';

export interface CreateUserOutput {
  user: User;
  token: string;
}

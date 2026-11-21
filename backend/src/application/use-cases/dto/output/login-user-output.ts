import { User } from '@/domain/entities/user';

export interface LoginUserOutput {
  user: User;
  token: string;
}

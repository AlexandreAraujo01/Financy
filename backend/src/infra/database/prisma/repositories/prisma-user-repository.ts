import { User } from '@/domain/entities/user';
import { IUser } from '@/domain/entities/props/user/user';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists-error';
import { UserRepository } from '@/ports/user-repository';
import type { PrismaClient, User as UserRow } from '../generated/client';
import { isRecordNotFound, isUniqueViolation } from '../prisma';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(user: User): Promise<User> {
    try {
      await this.prisma.user.create({ data: user.toSnapshot() });
    } catch (error) {
      throw this.translate(error, user.toSnapshot().email);
    }
    return user;
  }

  async find(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async delete(id: string): Promise<User | null> {
    try {
      return this.toDomain(await this.prisma.user.delete({ where: { id } }));
    } catch (error) {
      if (isRecordNotFound(error)) return null;
      throw error;
    }
  }

  async update(data: Partial<IUser>, id: string): Promise<User | null> {
    try {
      return this.toDomain(await this.prisma.user.update({ where: { id }, data }));
    } catch (error) {
      if (isRecordNotFound(error)) return null;
      throw this.translate(error, data.email ?? '');
    }
  }

  // Cobre a corrida em que duas requisições passam juntas pela checagem do use case.
  private translate(error: unknown, email: string): unknown {
    return isUniqueViolation(error, 'users_email_unique')
      ? new UserAlreadyExistsError(email)
      : error;
  }

  private toDomain({ id, createdAt, ...props }: UserRow): User {
    return User.create(props, id, createdAt);
  }
}

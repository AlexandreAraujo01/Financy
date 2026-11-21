import { Transaction } from '@/domain/entities/transaction';
import { ITransaction } from '@/domain/entities/props/transaction/transaction';
import { CategoryNotFoundError } from '@/domain/errors/category-not-found-error';
import { TransactionRepository } from '@/ports/transaction-repository';
import type { PrismaClient, Transaction as TransactionRow } from '../generated/client';
import { isForeignKeyViolation, isRecordNotFound } from '../prisma';

export class PrismaTransactionRepository implements TransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(transaction: Transaction): Promise<Transaction> {
    const data = transaction.toSnapshot();
    try {
      await this.prisma.transaction.create({ data });
    } catch (error) {
      throw this.translate(error, data.categoryId);
    }
    return transaction;
  }

  async find(id: string): Promise<Transaction | null> {
    const row = await this.prisma.transaction.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findManyActiveByUser(userId: string): Promise<Transaction[]> {
    // Usa o índice (user_id, date).
    const rows = await this.prisma.transaction.findMany({
      where: { userId, status: 'active' },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => this.toDomain(row));
  }

  async delete(id: string): Promise<Transaction | null> {
    try {
      return this.toDomain(await this.prisma.transaction.delete({ where: { id } }));
    } catch (error) {
      if (isRecordNotFound(error)) return null;
      throw error;
    }
  }

  async update(data: Partial<ITransaction>, id: string): Promise<Transaction | null> {
    try {
      return this.toDomain(await this.prisma.transaction.update({ where: { id }, data }));
    } catch (error) {
      if (isRecordNotFound(error)) return null;
      throw this.translate(error, data.categoryId ?? '');
    }
  }

  // Última barreira caso a checagem do use case seja pulada: a FK composta recusa
  // categoria de outro usuário, e isso vira o mesmo erro que o use case lança.
  private translate(error: unknown, categoryId: string): unknown {
    return isForeignKeyViolation(error, 'transactions_category_id_user_id_fkey')
      ? new CategoryNotFoundError(categoryId)
      : error;
  }

  private toDomain({ id, createdAt, ...props }: TransactionRow): Transaction {
    return Transaction.create(props, id, createdAt);
  }
}

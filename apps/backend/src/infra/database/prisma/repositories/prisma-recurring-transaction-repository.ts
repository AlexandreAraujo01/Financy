import { IRecurringTransaction } from '@/domain/entities/props/recurring-transaction/recurring-transaction';
import { RecurringTransaction } from '@/domain/entities/recurring-transaction';
import { CategoryNotFoundError } from '@/domain/errors/category-not-found-error';
import { RecurringTransactionRepository, type DueRecurrenceCursor } from '@/ports/recurring-transaction-repository';
import type {
  PrismaClient,
  RecurringTransaction as RecurringTransactionRow,
} from '../generated/client';
import { isForeignKeyViolation, isRecordNotFound } from '../prisma';

export class PrismaRecurringTransactionRepository implements RecurringTransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(recurrence: RecurringTransaction): Promise<RecurringTransaction> {
    const data = recurrence.toSnapshot();
    try {
      await this.prisma.recurringTransaction.create({ data });
    } catch (error) {
      throw this.translate(error, data.categoryId);
    }
    return recurrence;
  }

  async find(id: string): Promise<RecurringTransaction | null> {
    const row = await this.prisma.recurringTransaction.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findManyActiveByUser(userId: string): Promise<RecurringTransaction[]> {
    const rows = await this.prisma.recurringTransaction.findMany({
      where: { userId, status: 'active' },
      orderBy: [{ nextDueDate: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findManyDue(onOrBefore: Date, limit: number, after?: DueRecurrenceCursor): Promise<RecurringTransaction[]> {
    const rows = await this.prisma.recurringTransaction.findMany({
      where: {
        status: 'active',
        nextDueDate: { lte: onOrBefore },
        ...(after ? { OR: [
          { nextDueDate: { gt: after.nextDueDate } },
          { nextDueDate: after.nextDueDate, id: { gt: after.id } },
        ] } : {}),
      },
      orderBy: [{ nextDueDate: 'asc' }, { id: 'asc' }],
      take: limit,
    });
    return rows.map(row => this.toDomain(row));
  }

  async delete(id: string): Promise<RecurringTransaction | null> {
    try {
      return this.toDomain(await this.prisma.recurringTransaction.delete({ where: { id } }));
    } catch (error) {
      if (isRecordNotFound(error)) return null;
      throw error;
    }
  }

  async update(
    data: Partial<IRecurringTransaction>,
    id: string,
  ): Promise<RecurringTransaction | null> {
    try {
      return this.toDomain(await this.prisma.recurringTransaction.update({ where: { id }, data }));
    } catch (error) {
      if (isRecordNotFound(error)) return null;
      throw this.translate(error, data.categoryId ?? '');
    }
  }

  // A FK composta recusa categoria de outro usuário, como nas transações.
  private translate(error: unknown, categoryId: string): unknown {
    return isForeignKeyViolation(error, 'recurring_transactions_category_id_user_id_fkey')
      ? new CategoryNotFoundError(categoryId)
      : error;
  }

  private toDomain({ id, createdAt, ...props }: RecurringTransactionRow): RecurringTransaction {
    return RecurringTransaction.create(props, id, createdAt);
  }
}

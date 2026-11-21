import { RecurringTransaction } from '@/domain/entities/recurring-transaction';
import { IRecurringTransaction } from '@/domain/entities/props/recurring-transaction/recurring-transaction';
import { Repository } from './repository';

export interface DueRecurrenceCursor {
  nextDueDate: Date;
  id: string;
}

export abstract class RecurringTransactionRepository extends Repository<
  RecurringTransaction,
  IRecurringTransaction
> {
  // Recorrências ativas do usuário, pela próxima data.
  abstract findManyActiveByUser(userId: string): Promise<RecurringTransaction[]>;

  // Só vencidas, de todos os usuários, em lotes com paginação estável.
  abstract findManyDue(onOrBefore: Date, limit: number, after?: DueRecurrenceCursor): Promise<RecurringTransaction[]>;
}

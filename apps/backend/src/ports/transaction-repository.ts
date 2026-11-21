import { Transaction } from '@/domain/entities/transaction';
import { ITransaction } from '@/domain/entities/props/transaction/transaction';
import { Repository } from './repository';

export abstract class TransactionRepository extends Repository<Transaction, ITransaction> {
  // Transações ativas do usuário, da mais recente pra mais antiga.
  abstract findManyActiveByUser(userId: string): Promise<Transaction[]>;
}

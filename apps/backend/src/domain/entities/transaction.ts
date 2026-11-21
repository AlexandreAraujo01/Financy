import { Entity } from '@/domain/core/entity';
import { ITransaction } from './props/transaction/transaction';

export class Transaction extends Entity<ITransaction> {
  protected constructor(data: ITransaction, id?: string, createdAt?: Date) {
    super(data, id, createdAt);
  }

  static create(data: ITransaction, id?: string, createdAt?: Date) {
    return new Transaction({ ...data, description: data.description.trim() }, id, createdAt);
  }

  get isActive(): boolean {
    return this.props.status === 'active';
  }

  // Positivo pra entrada e negativo pra saída, pra calcular saldo com uma soma.
  get signedValueInCents(): number {
    return this.props.type === 'income'
      ? this.props.valueInCents
      : -this.props.valueInCents;
  }
}

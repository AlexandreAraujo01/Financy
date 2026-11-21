import { CircleArrowDown, CircleArrowUp, Repeat } from 'lucide-react';
import type { Transaction } from '@/graphql/types';
import { formatCurrency } from '@/lib/format';

export function TransactionValue({
  transaction,
  withIcon = false,
}: {
  transaction: Transaction;
  withIcon?: boolean;
}) {
  const income = transaction.type === 'income';
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-gray-800">
      {income ? '+' : '-'} {formatCurrency(transaction.valueInCents)}
      {withIcon &&
        (income ? (
          <CircleArrowUp className="size-4 text-green-base" />
        ) : (
          <CircleArrowDown className="size-4 text-red-base" />
        ))}
    </span>
  );
}

// Marca as transações lançadas automaticamente por uma recorrência.
export function RecurringMark({ transaction }: { transaction: Transaction }) {
  if (!transaction.recurringTransactionId) return null;
  return (
    <span title="Recorrente: lançada todo mês" aria-label="Recorrente" className="shrink-0 text-gray-400">
      <Repeat className="size-3.5" />
    </span>
  );
}

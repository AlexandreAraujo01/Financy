import { CircleArrowDown, CircleArrowUp } from 'lucide-react';
import type { TransactionType } from '@/graphql/types';

export function TransactionTypeLabel({ type }: { type: TransactionType }) {
  return type === 'income' ? (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-green-dark">
      <CircleArrowUp className="size-4 text-green-base" />
      Entrada
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-red-dark">
      <CircleArrowDown className="size-4 text-red-base" />
      Saída
    </span>
  );
}

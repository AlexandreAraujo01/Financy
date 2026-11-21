import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { CATEGORIES, TRANSACTIONS } from '@/graphql/operations';
import type { Category, Transaction } from '@/graphql/types';

export interface CategoryStats {
  category: Category;
  count: number;
  // Soma dos valores (sem sinal) das transações da categoria, em centavos.
  totalInCents: number;
}

// Dashboard e páginas trabalham sobre as duas listas completas do usuário.
export function useFinanceData() {
  const categoriesQuery = useQuery(CATEGORIES);
  const transactionsQuery = useQuery(TRANSACTIONS);

  const categories = categoriesQuery.data?.categories ?? [];
  const transactions = transactionsQuery.data?.transactions ?? [];

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const statsByCategory = useMemo(() => {
    const stats = new Map<string, CategoryStats>(
      categories.map((category) => [category.id, { category, count: 0, totalInCents: 0 }]),
    );
    for (const transaction of transactions) {
      const entry = stats.get(transaction.categoryId);
      if (entry) {
        entry.count += 1;
        entry.totalInCents += transaction.valueInCents;
      }
    }
    return stats;
  }, [categories, transactions]);

  return {
    categories,
    transactions,
    categoryById,
    statsByCategory,
    loading: categoriesQuery.loading || transactionsQuery.loading,
    error: categoriesQuery.error ?? transactionsQuery.error,
  };
}

export function signedValue(transaction: Transaction): number {
  return transaction.type === 'income' ? transaction.valueInCents : -transaction.valueInCents;
}

import { useMutation, useQuery } from '@apollo/client/react';
import { CalendarX2, Plus, SquarePen } from 'lucide-react';
import { useState } from 'react';
import { CategoryBadge, CategoryTag } from '@/components/category-style';
import { PageHeader } from '@/components/page-header';
import { RecurringModal } from '@/components/recurring-modal';
import { TransactionTypeLabel } from '@/components/transaction-type-label';
import { Button, IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  END_RECURRING_TRANSACTION,
  RECURRING_TRANSACTIONS,
  REFETCH_LISTS,
} from '@/graphql/operations';
import type { RecurringTransaction } from '@/graphql/types';
import { useFinanceData } from '@/hooks/use-finance-data';
import { formatCurrency, formatShortDate } from '@/lib/format';

type Editing = { recurrence?: RecurringTransaction } | null;

export function RecurringPage() {
  const { categories, categoryById } = useFinanceData();
  const { data, loading } = useQuery(RECURRING_TRANSACTIONS);
  const [endRecurring] = useMutation(END_RECURRING_TRANSACTION, { refetchQueries: REFETCH_LISTS });
  const [editing, setEditing] = useState<Editing>(null);

  const recurrences = data?.recurringTransactions ?? [];

  // Saldo previsto de um mês só com as recorrências.
  const monthlyNet = recurrences.reduce(
    (total, r) => total + (r.type === 'income' ? r.valueInCents : -r.valueInCents),
    0,
  );

  async function handleEnd(recurrence: RecurringTransaction) {
    if (
      window.confirm(
        `Encerrar "${recurrence.description}"?\n\nOs próximos meses não serão mais lançados; o que já foi lançado continua no histórico.`,
      )
    ) {
      await endRecurring({ variables: { id: recurrence.id } });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Recorrentes"
        subtitle="Salários, assinaturas e contas que se repetem todo mês"
        action={
          <Button size="sm" onClick={() => setEditing({})}>
            <Plus className="size-4" />
            Nova recorrência
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="responsive-table w-full min-w-[1000px] table-fixed">
            <thead className="border-b border-gray-200">
              <tr className="text-xs font-medium uppercase tracking-[0.6px] text-gray-500">
                <th className="px-6 py-5 text-left font-medium">Descrição</th>
                <th className="w-[200px] px-6 py-5 text-center font-medium">Categoria</th>
                <th className="w-[136px] px-6 py-5 text-center font-medium">Tipo</th>
                <th className="w-[136px] px-6 py-5 text-center font-medium">Quando</th>
                <th className="w-[120px] px-6 py-5 text-center font-medium">Próxima</th>
                <th className="w-[160px] px-6 py-5 text-right font-medium">Valor</th>
                <th className="w-[120px] px-6 py-5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {recurrences.map((recurrence) => {
                const category = categoryById.get(recurrence.categoryId);
                return (
                  <tr key={recurrence.id} className="h-[72px] border-b border-gray-200">
                    <td data-label="Descrição" className="px-6">
                      <div className="flex min-w-0 items-center gap-3 xl:gap-4">
                        <CategoryBadge icon={category?.icon} color={category?.color} />
                        <span className="truncate text-base font-medium text-gray-800">
                          {recurrence.description}
                        </span>
                      </div>
                    </td>
                    <td data-label="Categoria" className="px-6 text-center">
                      <CategoryTag name={category?.name ?? 'Excluída'} color={category?.color} />
                    </td>
                    <td data-label="Tipo" className="px-6 text-center">
                      <TransactionTypeLabel type={recurrence.type} />
                    </td>
                    <td data-label="Quando" className="px-6 text-center text-sm text-gray-600">
                      {recurrence.dayType === 'business_day'
                        ? `${recurrence.dayOfMonth}º dia útil`
                        : `Dia ${recurrence.dayOfMonth}`}
                    </td>
                    <td data-label="Próxima" className="px-6 text-center text-sm text-gray-600">
                      {formatShortDate(recurrence.nextDueDate)}
                    </td>
                    <td data-label="Valor" className="whitespace-nowrap px-6 text-right text-sm font-semibold text-gray-800">
                      {recurrence.type === 'income' ? '+' : '-'}{' '}
                      {formatCurrency(recurrence.valueInCents)}
                    </td>
                    <td data-label="Ações" className="px-6">
                      <div className="flex justify-end gap-2">
                        <IconButton
                          label="Encerrar"
                          tone="danger"
                          onClick={() => handleEnd(recurrence)}
                        >
                          <CalendarX2 className="size-4" />
                        </IconButton>
                        <IconButton label="Editar" onClick={() => setEditing({ recurrence })}>
                          <SquarePen className="size-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {recurrences.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-500">
            {loading
              ? 'Carregando...'
              : 'Nenhuma recorrência. Cadastre seu salário ou uma assinatura pra lançar todo mês.'}
          </p>
        ) : (
          <footer className="flex flex-col gap-4 px-4 py-5 text-sm text-gray-700 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
            <p>
              <strong className="font-medium">{recurrences.length}</strong>{' '}
              {recurrences.length === 1 ? 'recorrência ativa' : 'recorrências ativas'}
            </p>
            <p>
              Saldo mensal previsto:{' '}
              <strong
                className={`font-semibold ${monthlyNet < 0 ? 'text-red-dark' : 'text-green-dark'}`}
              >
                {monthlyNet < 0 ? '-' : '+'} {formatCurrency(Math.abs(monthlyNet))}
              </strong>
            </p>
          </footer>
        )}
      </Card>

      {editing && (
        <RecurringModal
          categories={categories}
          recurrence={editing.recurrence}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

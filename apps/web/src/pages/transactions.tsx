import type { Reference } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { ChevronLeft, ChevronRight, Plus, Search, SquarePen, Trash } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { CategoryBadge, CategoryTag } from '@/components/category-style';
import { PageHeader } from '@/components/page-header';
import { TransactionModal } from '@/components/transaction-modal';
import { TransactionTypeLabel } from '@/components/transaction-type-label';
import { RecurringMark, TransactionValue } from '@/components/transaction-value';
import { Button, IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SelectField, TextField } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { DELETE_TRANSACTION, TRANSACTIONS } from '@/graphql/operations';
import type { Transaction } from '@/graphql/types';
import { useFinanceData } from '@/hooks/use-finance-data';
import { formatShortDate } from '@/lib/format';

const PAGE_SIZE = 10;
const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function monthLabel(month: string): string {
  const [year, index] = month.split('-');
  return `${MONTHS[Number(index) - 1]} / ${year}`;
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

type Editing = { transaction?: Transaction } | null;

export function TransactionsPage() {
  const [searchParams] = useSearchParams();
  const { categories, transactions, categoryById, loading } = useFinanceData();
  const [deleteTransaction, { loading: deleting }] = useMutation(DELETE_TRANSACTION, {
    refetchQueries: [TRANSACTIONS],
    awaitRefetchQueries: true,
    update(cache, { data }) {
      if (!data?.deleteTransaction) return;
      const deletedId = data.deleteTransaction.id;
      // Atualiza também os dados usados pelo dashboard quando ele está desmontado.
      cache.modify({
        fields: {
          transactions(existing: readonly Reference[] = [], { readField }) {
            return existing.filter(transaction => readField('id', transaction) !== deletedId);
          },
        },
      });
    },
  });
  const [editing, setEditing] = useState<Editing>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [period, setPeriod] = useState(() => searchParams.get('period') === 'all' ? 'all' : currentMonth());
  const [page, setPage] = useState(1);

  // Meses com transação, mais o atual, do mais recente pro mais antigo.
  const months = useMemo(() => {
    const set = new Set(transactions.map((t) => t.date.slice(0, 7)));
    set.add(currentMonth());
    return [...set].sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return transactions.filter(
      (t) =>
        (!term || t.description.toLowerCase().includes(term)) &&
        (type === 'all' || t.type === type) &&
        (categoryId === 'all' || t.categoryId === categoryId) &&
        (period === 'all' || t.date.startsWith(period)),
    );
  }, [transactions, search, type, categoryId, period]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const firstPage = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  const firstMobilePage = Math.max(1, Math.min(currentPage - 1, pageCount - 2));
  const pageNumbers = Array.from(
    { length: Math.min(5, pageCount) },
    (_, index) => firstPage + index,
  );

  // Qualquer filtro novo volta pra primeira página.
  function filter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  async function handleDelete() {
    if (!pendingDelete || deleting) return;
    setDeleteError('');
    try {
      const { data } = await deleteTransaction({ variables: { id: pendingDelete.id } });
      if (data?.deleteTransaction.id !== pendingDelete.id) throw new Error('Exclusão não confirmada');
      setPendingDelete(null);
    } catch {
      setDeleteError('Não foi possível concluir a exclusão. Atualize a lista e tente novamente.');
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Transações"
        subtitle="Gerencie todas as suas transações financeiras"
        action={
          <Button size="sm" onClick={() => setEditing({})}>
            <Plus className="size-4" />
            Nova transação
          </Button>
        }
      />

      <Card className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        <TextField
          id="filter-search"
          label="Buscar"
          placeholder="Buscar por descrição"
          icon={<Search />}
          value={search}
          onChange={(event) => filter(setSearch)(event.target.value)}
        />
        <SelectField
          id="filter-type"
          label="Tipo"
          value={type}
          onChange={(event) => filter(setType)(event.target.value)}
        >
          <option value="all">Todos</option>
          <option value="income">Entrada</option>
          <option value="expense">Saída</option>
        </SelectField>
        <SelectField
          id="filter-category"
          label="Categoria"
          value={categoryId}
          onChange={(event) => filter(setCategoryId)(event.target.value)}
        >
          <option value="all">Todas</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          id="filter-period"
          label="Período"
          value={period}
          onChange={(event) => filter(setPeriod)(event.target.value)}
        >
          <option value="all">Todos os períodos</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {monthLabel(month)}
            </option>
          ))}
        </SelectField>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="responsive-table w-full min-w-[1000px] table-fixed">
            <thead className="border-b border-gray-200">
              <tr className="text-xs font-medium uppercase tracking-[0.6px] text-gray-500">
                <th className="px-6 py-5 text-left font-medium">Descrição</th>
                <th className="w-28 px-6 py-5 text-center font-medium">Data</th>
                <th className="w-[200px] px-6 py-5 text-center font-medium">Categoria</th>
                <th className="w-[136px] px-6 py-5 text-center font-medium">Tipo</th>
                <th className="w-[200px] px-6 py-5 text-right font-medium">Valor</th>
                <th className="w-[120px] px-6 py-5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((transaction) => {
                const category = categoryById.get(transaction.categoryId);
                return (
                  <tr key={transaction.id} className="h-[72px] border-b border-gray-200">
                    <td data-label="Descrição" className="px-6">
                      <div className="flex min-w-0 items-center gap-3 xl:gap-4">
                        <CategoryBadge icon={category?.icon} color={category?.color} />
                        <span className="truncate text-base font-medium text-gray-800">
                          {transaction.description}
                        </span>
                        <RecurringMark transaction={transaction} />
                      </div>
                    </td>
                    <td data-label="Data" className="px-6 text-center text-sm text-gray-600">
                      {formatShortDate(transaction.date)}
                    </td>
                    <td data-label="Categoria" className="px-6 text-center">
                      <CategoryTag name={category?.name ?? 'Excluída'} color={category?.color} />
                    </td>
                    <td data-label="Tipo" className="px-6 text-center">
                      <TransactionTypeLabel type={transaction.type} />
                    </td>
                    <td data-label="Valor" className="px-6 text-right">
                      <TransactionValue transaction={transaction} />
                    </td>
                    <td data-label="Ações" className="px-6">
                      <div className="flex justify-end gap-2">
                        <IconButton
                          label="Excluir"
                          tone="danger"
                          onClick={() => {
                            setDeleteError('');
                            setPendingDelete(transaction);
                          }}
                        >
                          <Trash className="size-4" />
                        </IconButton>
                        <IconButton label="Editar" onClick={() => setEditing({ transaction })}>
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

        {visible.length === 0 && (
          <p className="border-b border-gray-200 px-6 py-10 text-center text-sm text-gray-500">
            {loading ? 'Carregando...' : 'Nenhuma transação encontrada.'}
          </p>
        )}

        <footer className="flex flex-col gap-4 px-4 py-5 text-sm text-gray-700 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
          <p>
            {filtered.length === 0 ? (
              <>
                <strong className="font-medium">0</strong> resultados
              </>
            ) : (
              <>
                <strong className="font-medium">{start + 1}</strong> a{' '}
                <strong className="font-medium">{start + visible.length}</strong> |{' '}
                <strong className="font-medium">{filtered.length}</strong>{' '}
                {filtered.length === 1 ? 'resultado' : 'resultados'}
              </>
            )}
          </p>
          <nav aria-label="Paginação" className="flex flex-wrap items-center gap-2">
            <IconButton
              label="Página anterior"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft className="size-4" />
            </IconButton>
            {pageNumbers.map((number) => (
              <button
                key={number}
                type="button"
                aria-current={number === currentPage ? 'page' : undefined}
                onClick={() => setPage(number)}
                className={`${number >= firstMobilePage && number < firstMobilePage + 3 ? 'inline-flex' : 'hidden sm:inline-flex'} size-8 cursor-pointer items-center justify-center rounded-lg text-sm font-medium ${
                  number === currentPage
                    ? 'bg-brand text-white'
                    : 'border border-gray-300 bg-surface text-gray-700 hover:bg-gray-100'
                }`}
              >
                {number}
              </button>
            ))}
            <IconButton
              label="Próxima página"
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight className="size-4" />
            </IconButton>
          </nav>
        </footer>
      </Card>

      {editing && (
        <TransactionModal
          categories={categories}
          transaction={editing.transaction}
          onClose={() => setEditing(null)}
        />
      )}
      {pendingDelete && (
        <Modal
          title="Excluir transação"
          description={`Deseja excluir “${pendingDelete.description}”?`}
          onClose={() => { if (!deleting) setPendingDelete(null); }}
        >
          <p className="text-sm text-gray-600">
            O lançamento será removido da lista, do saldo e dos totais do dashboard.
            {pendingDelete.recurringTransactionId && ' Excluir este lançamento não encerra a recorrência.'}
          </p>
          {deleteError && <p role="alert" className="text-sm text-red-base">{deleteError}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={deleting} onClick={() => setPendingDelete(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Excluindo...' : 'Excluir transação'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

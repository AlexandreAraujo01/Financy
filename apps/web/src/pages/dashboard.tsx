import { ChevronRight, CircleArrowDown, CircleArrowUp, Plus, Wallet } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { CategoryBadge, CategoryTag } from '@/components/category-style';
import { TransactionModal } from '@/components/transaction-modal';
import { RecurringMark, TransactionValue } from '@/components/transaction-value';
import { Card, Eyebrow } from '@/components/ui/card';
import { signedValue, useFinanceData } from '@/hooks/use-finance-data';
import { formatCurrency, formatShortDate, pluralItems } from '@/lib/format';

const RECENT_LIMIT = 5;
const CATEGORIES_LIMIT = 5;

export function DashboardPage() {
  const { categories, transactions, categoryById, statsByCategory, loading } = useFinanceData();
  const [creating, setCreating] = useState(false);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = transactions.filter((t) => t.date.startsWith(currentMonth));

  const balance = transactions.reduce((total, t) => total + signedValue(t), 0);
  const monthIncome = sumOf(thisMonth.filter((t) => t.type === 'income'));
  const monthExpense = sumOf(thisMonth.filter((t) => t.type === 'expense'));

  // O backend já devolve da mais recente pra mais antiga.
  const recent = transactions.slice(0, RECENT_LIMIT);
  const topCategories = [...statsByCategory.values()]
    .filter(stats => stats.count > 0)
    .sort((a, b) => b.count - a.count || b.totalInCents - a.totalInCents)
    .slice(0, CATEGORIES_LIMIT);

  return (
    <div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:grid-cols-3 sm:gap-6">
      <section
        aria-label="Resumo financeiro"
        className="overflow-hidden rounded-xl border border-gray-200 bg-surface sm:col-span-3 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent"
      >
        <SummaryCard icon={<Wallet className="text-purple-base" />} label="Saldo total" value={balance} />
        <SummaryCard
          icon={<CircleArrowUp className="text-green-base" />}
          label="Receitas do mês"
          value={monthIncome}
        />
        <SummaryCard
          icon={<CircleArrowDown className="text-red-base" />}
          label="Despesas do mês"
          value={monthExpense}
        />
      </section>

      <Card className="min-w-0 overflow-hidden sm:col-span-3 lg:col-span-2">
        <SectionHeader title="Transações recentes" linkTo="/transacoes?period=all" linkLabel="Ver todas" />
        {loading ? (
          <EmptyRow>Carregando...</EmptyRow>
        ) : recent.length === 0 ? (
          <EmptyRow>Nenhuma transação ainda.</EmptyRow>
        ) : (
          <ul>
            {recent.map((transaction) => {
              const category = categoryById.get(transaction.categoryId);
              return (
                <li
                  key={transaction.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 border-b border-gray-200 p-4 xl:flex xl:h-20 xl:gap-0 xl:p-0"
                >
                  <div className="col-span-2 flex min-w-0 flex-1 items-center gap-3 xl:gap-4 xl:px-6">
                    <CategoryBadge icon={category?.icon} color={category?.color} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="flex items-center gap-1.5 text-base font-medium text-gray-800">
                        <span className="truncate">{transaction.description}</span>
                        <RecurringMark transaction={transaction} />
                      </p>
                      <p className="text-sm text-gray-600">{formatShortDate(transaction.date)}</p>
                    </div>
                  </div>
                  <div className="col-start-1 row-start-2 flex min-w-0 pl-[52px] xl:w-40 xl:shrink-0 xl:justify-center xl:px-6">
                    <CategoryTag name={category?.name ?? 'Excluída'} color={category?.color} />
                  </div>
                  <div className="col-start-2 row-start-2 flex shrink-0 justify-end xl:w-40 xl:px-6">
                    <TransactionValue transaction={transaction} withIcon />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex justify-center px-6 py-5">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-brand-foreground hover:underline"
          >
            <Plus className="size-5" />
            Nova transação
          </button>
        </div>
      </Card>

      <Card className="hidden min-w-0 lg:col-span-1 lg:block">
        <SectionHeader title="Categorias" linkTo="/categorias" linkLabel="Gerenciar" />
        {loading ? (
          <EmptyRow>Carregando...</EmptyRow>
        ) : topCategories.length === 0 ? (
          <EmptyRow>Nenhuma categoria ainda.</EmptyRow>
        ) : (
          <ul className="flex flex-col gap-5 p-6">
            {topCategories.map(({ category, count, totalInCents }) => (
              <li key={category.id} className="flex min-w-0 flex-wrap items-center gap-2">
                <CategoryTag name={category.name} color={category.color} />
                <span className="flex-1 whitespace-nowrap text-right text-sm text-gray-600">
                  {pluralItems(count)}
                </span>
                <span className="min-w-[88px] shrink-0 whitespace-nowrap text-right text-sm font-semibold text-gray-800">
                  {formatCurrency(totalInCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {creating && (
        <TransactionModal categories={categories} onClose={() => setCreating(false)} />
      )}
    </div>
  );
}

function sumOf(list: { valueInCents: number }[]): number {
  return list.reduce((total, t) => total + t.valueInCents, 0);
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-gray-200 p-4 first:border-t-0 sm:flex-col sm:items-stretch sm:gap-4 sm:rounded-xl sm:border sm:bg-surface sm:p-5 sm:first:border-t xl:p-[25px]">
      <div className="flex items-center gap-3 [&>svg]:size-5">
        {icon}
        <Eyebrow>{label}</Eyebrow>
      </div>
      <p className="min-w-0 break-words text-lg font-bold leading-8 text-gray-800 sm:text-2xl xl:text-[28px]">{formatCurrency(value)}</p>
    </div>
  );
}

function SectionHeader({
  title,
  linkTo,
  linkLabel,
}: {
  title: string;
  linkTo: string;
  linkLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-5 sm:px-6">
      <Eyebrow>{title}</Eyebrow>
      <Link
        to={linkTo}
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-foreground hover:underline"
      >
        {linkLabel}
        <ChevronRight className="size-5" />
      </Link>
    </div>
  );
}

function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="px-6 py-8 text-center text-sm text-gray-500">{children}</p>;
}

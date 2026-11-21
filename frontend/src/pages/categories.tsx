import { useMutation } from '@apollo/client/react';
import { ArrowUpDown, Plus, SquarePen, Tag, Trash } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { CategoryModal } from '@/components/category-modal';
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CategoryBadge,
  CategoryTag,
} from '@/components/category-style';
import { PageHeader } from '@/components/page-header';
import { Button, IconButton } from '@/components/ui/button';
import { Card, Eyebrow } from '@/components/ui/card';
import { DELETE_CATEGORY, REFETCH_LISTS } from '@/graphql/operations';
import type { Category } from '@/graphql/types';
import { useFinanceData } from '@/hooks/use-finance-data';
import { pluralItems } from '@/lib/format';

type Editing = { category?: Category } | null;

export function CategoriesPage() {
  const { categories, transactions, statsByCategory, loading } = useFinanceData();
  const [deleteCategory] = useMutation(DELETE_CATEGORY, { refetchQueries: REFETCH_LISTS });
  const [editing, setEditing] = useState<Editing>(null);

  const mostUsed = [...statsByCategory.values()]
    .filter((stats) => stats.count > 0)
    .sort((a, b) => b.count - a.count)[0]?.category;
  const MostUsedIcon = mostUsed ? CATEGORY_ICONS[mostUsed.icon] : Tag;

  async function handleDelete(category: Category) {
    const count = statsByCategory.get(category.id)?.count ?? 0;
    const warning = count
      ? `\n\nAs ${pluralItems(count)} dela continuam no histórico, sem categoria ativa.`
      : '';
    if (window.confirm(`Excluir a categoria "${category.name}"?${warning}`)) {
      await deleteCategory({ variables: { id: category.id } });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Categorias"
        subtitle="Organize suas transações por categorias"
        action={
          <Button size="sm" onClick={() => setEditing({})}>
            <Plus className="size-4" />
            Nova categoria
          </Button>
        }
      />

      <section
        aria-label="Resumo das categorias"
        className="overflow-hidden rounded-xl border border-gray-200 bg-surface sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent"
      >
        <StatCard icon={<Tag className="text-gray-700" />} value={String(categories.length)} label="Total de categorias" />
        <StatCard
          icon={<ArrowUpDown className="text-purple-base" />}
          value={String(transactions.length)}
          label="Total de transações"
        />
        <StatCard
          icon={
            <MostUsedIcon
              className={mostUsed ? CATEGORY_COLORS[mostUsed.color].text : 'text-gray-400'}
            />
          }
          value={mostUsed?.name ?? '—'}
          label="Categoria mais utilizada"
        />
      </section>

      {categories.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-gray-500">
          {loading ? 'Carregando...' : 'Nenhuma categoria ainda. Crie a primeira!'}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Card key={category.id} className="flex min-w-0 flex-col gap-5 p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <CategoryBadge icon={category.icon} color={category.color} />
                <div className="flex gap-2">
                  <IconButton label="Excluir" tone="danger" onClick={() => handleDelete(category)}>
                    <Trash className="size-4" />
                  </IconButton>
                  <IconButton label="Editar" onClick={() => setEditing({ category })}>
                    <SquarePen className="size-4" />
                  </IconButton>
                </div>
              </div>
              <div className="flex min-h-[64px] flex-1 flex-col gap-1">
                <h2 className="truncate text-base font-semibold text-gray-800">{category.name}</h2>
                {category.description && (
                  <p className="line-clamp-2 text-sm text-gray-600">{category.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <CategoryTag name={category.name} color={category.color} />
                <span className="whitespace-nowrap text-sm text-gray-600">
                  {pluralItems(statsByCategory.get(category.id)?.count ?? 0)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && <CategoryModal category={editing.category} onClose={() => setEditing(null)} />}
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-t border-gray-200 p-4 first:border-t-0 sm:items-start sm:gap-4 sm:rounded-xl sm:border sm:bg-surface sm:p-5 sm:first:border-t xl:px-6 xl:py-[25px]">
      <span className="shrink-0 sm:mt-1 [&>svg]:size-5 sm:[&>svg]:size-6">{icon}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1 sm:flex-col sm:items-start sm:gap-2">
        <p className="max-w-full break-words text-lg font-bold leading-8 text-gray-800 sm:truncate sm:text-[28px]">{value}</p>
        <Eyebrow className="order-first sm:order-last">{label}</Eyebrow>
      </div>
    </div>
  );
}

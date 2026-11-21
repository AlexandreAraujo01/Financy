import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@apollo/client/react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { CREATE_CATEGORY, REFETCH_LISTS, UPDATE_CATEGORY } from '@/graphql/operations';
import type { Category, CategoryColor, CategoryIcon } from '@/graphql/types';
import { errorCode } from '@/lib/errors';
import { CATEGORY_COLORS, CATEGORY_ICONS } from './category-style';
import { Button } from './ui/button';
import { TextField } from './ui/field';
import { Modal } from './ui/modal';

const ICONS = Object.keys(CATEGORY_ICONS) as CategoryIcon[];
const COLORS = Object.keys(CATEGORY_COLORS) as CategoryColor[];

const schema = z.object({
  name: z.string().trim().min(1, 'Informe o título').max(50, 'Máximo de 50 caracteres'),
  description: z.string().trim().max(200, 'Máximo de 200 caracteres'),
  icon: z.enum(ICONS as [CategoryIcon, ...CategoryIcon[]]),
  color: z.enum(COLORS as [CategoryColor, ...CategoryColor[]]),
});

type FormValues = z.infer<typeof schema>;

interface CategoryModalProps {
  category?: Category | undefined;
  onClose(): void;
}

export function CategoryModal({ category, onClose }: CategoryModalProps) {
  const [createCategory] = useMutation(CREATE_CATEGORY, { refetchQueries: REFETCH_LISTS });
  const [updateCategory] = useMutation(UPDATE_CATEGORY, { refetchQueries: REFETCH_LISTS });

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
      icon: category?.icon ?? 'briefcase_business',
      color: category?.color ?? 'green',
    },
  });

  async function onSubmit({ description, ...values }: FormValues) {
    const data = { ...values, description: description || null };
    try {
      if (category) {
        await updateCategory({ variables: { id: category.id, data } });
      } else {
        await createCategory({ variables: { data } });
      }
      onClose();
    } catch (error) {
      if (errorCode(error) === 'CONFLICT') {
        setError('name', { message: 'Você já tem uma categoria com esse nome' });
      } else {
        setError('root', { message: 'Não foi possível salvar a categoria. Tente novamente.' });
      }
    }
  }

  return (
    <Modal
      title={category ? 'Editar categoria' : 'Nova categoria'}
      description="Organize suas transações com categorias"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <div className="flex flex-col gap-4">
          <TextField
            id="category-name"
            label="Título"
            placeholder="Ex. Alimentação"
            error={errors.name?.message}
            {...register('name')}
          />
          <TextField
            id="category-description"
            label="Descrição"
            placeholder="Descrição da categoria"
            hint="Opcional"
            error={errors.description?.message}
            {...register('description')}
          />

          <Controller
            control={control}
            name="icon"
            render={({ field }) => (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-medium text-gray-700">Ícone</legend>
                <div role="radiogroup" aria-label="Ícone" className="flex flex-wrap gap-2">
                  {ICONS.map((icon) => {
                    const Icon = CATEGORY_ICONS[icon];
                    const selected = field.value === icon;
                    return (
                      <button
                        key={icon}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={icon.replace(/_/g, ' ')}
                        onClick={() => field.onChange(icon)}
                        className={`flex size-[42px] cursor-pointer items-center justify-center rounded-lg border transition-colors ${
                          selected ? 'border-brand-foreground bg-gray-100' : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="size-5 text-gray-600" />
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
          />

          <Controller
            control={control}
            name="color"
            render={({ field }) => (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-medium text-gray-700">Cor</legend>
                <div role="radiogroup" aria-label="Cor" className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {COLORS.map((color) => {
                    const selected = field.value === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={color}
                        onClick={() => field.onChange(color)}
                        className={`flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-lg border p-[5px] transition-colors ${
                          selected ? 'border-brand-foreground bg-gray-100' : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <span className={`h-5 w-full rounded ${CATEGORY_COLORS[color].swatch}`} />
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
          />
        </div>

        {errors.root?.message && <p className="text-sm text-red-base">{errors.root.message}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </Modal>
  );
}

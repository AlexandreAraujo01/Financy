import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@apollo/client/react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  CREATE_RECURRING_TRANSACTION,
  REFETCH_LISTS,
  UPDATE_RECURRING_TRANSACTION,
} from '@/graphql/operations';
import type { Category, RecurringTransaction } from '@/graphql/types';
import { errorCode } from '@/lib/errors';
import { dateInputToIso, formatAmount, parseAmount, todayDateInput } from '@/lib/format';
import { TypeOption } from './transaction-modal';
import { Button } from './ui/button';
import { SelectField, TextField } from './ui/field';
import { Modal } from './ui/modal';

const schema = z.object({
  type: z.enum(['expense', 'income']),
  description: z.string().trim().min(1, 'Informe a descrição').max(100, 'Máximo de 100 caracteres'),
  valueInCents: z.number().int().positive('Informe um valor maior que zero'),
  categoryId: z.string().min(1, 'Selecione a categoria'),
  dayOfMonth: z.number().int().min(1).max(31),
  dayType: z.enum(['calendar_day', 'business_day']),
  startDate: z.string().min(1, 'Selecione a data'),
}).refine(data => data.dayType !== 'business_day' || data.dayOfMonth <= 23, {
  path: ['dayOfMonth'], message: 'Escolha um dia útil entre 1 e 23',
});

type FormValues = z.infer<typeof schema>;

interface RecurringModalProps {
  categories: Category[];
  // Com recorrência, o modal edita os próximos lançamentos; sem, cria.
  recurrence?: RecurringTransaction | undefined;
  onClose(): void;
}

export function RecurringModal({ categories, recurrence, onClose }: RecurringModalProps) {
  const [createRecurring] = useMutation(CREATE_RECURRING_TRANSACTION, {
    refetchQueries: REFETCH_LISTS,
  });
  const [updateRecurring] = useMutation(UPDATE_RECURRING_TRANSACTION, {
    refetchQueries: REFETCH_LISTS,
  });

  const today = todayDateInput();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: recurrence
      ? { ...recurrence, startDate: recurrence.startDate.slice(0, 10) }
      : {
          type: 'expense',
          description: '',
          valueInCents: 0,
          categoryId: '',
          dayOfMonth: Number(today.slice(8, 10)),
          dayType: 'calendar_day',
          startDate: today,
        },
  });

  const dayType = watch('dayType');
  const businessDay = dayType === 'business_day';
  const days = Array.from({ length: businessDay ? 23 : 31 }, (_, index) => index + 1);

  async function onSubmit({ startDate, ...data }: FormValues) {
    try {
      if (recurrence) {
        await updateRecurring({ variables: { id: recurrence.id, data } });
      } else {
        await createRecurring({
          variables: { data: { ...data, startDate: dateInputToIso(startDate) } },
        });
      }
      onClose();
    } catch (error) {
      setError('root', {
        message:
          errorCode(error) === 'NOT_FOUND'
            ? 'Essa categoria não está mais disponível. Escolha outra.'
            : 'Não foi possível salvar a recorrência. Tente novamente.',
      });
    }
  }

  return (
    <Modal
      title={recurrence ? 'Editar recorrência' : 'Nova recorrência'}
      description={
        recurrence
          ? 'As mudanças valem para os próximos lançamentos'
          : 'Escolha quando lançar automaticamente todo mês'
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <div
              role="radiogroup"
              aria-label="Tipo"
              className="flex rounded-xl border border-gray-200 p-2"
            >
              <TypeOption
                type="expense"
                selected={field.value === 'expense'}
                onSelect={() => field.onChange('expense')}
              />
              <TypeOption
                type="income"
                selected={field.value === 'income'}
                onSelect={() => field.onChange('income')}
              />
            </div>
          )}
        />

        <div className="flex flex-col gap-4">
          <TextField
            id="recurring-description"
            label="Descrição"
            placeholder="Ex. Salário, Netflix, Aluguel"
            error={errors.description?.message}
            {...register('description')}
          />
          <SelectField
            id="recurring-day-type"
            label="Repetir em"
            error={errors.dayType?.message}
            {...register('dayType', {
              onChange: event => {
                if (event.target.value === 'business_day' && watch('dayOfMonth') > 23) {
                  setValue('dayOfMonth', 23, { shouldValidate: true });
                }
              },
            })}
          >
            <option value="calendar_day">Dia fixo do mês</option>
            <option value="business_day">Dia útil do mês</option>
          </SelectField>
          <div className="flex flex-col gap-4 min-[400px]:flex-row [&>*]:min-w-0 [&>*]:flex-1">
            <SelectField
              id="recurring-day"
              label={businessDay ? 'Qual dia útil?' : 'Todo dia'}
              error={errors.dayOfMonth?.message}
              {...register('dayOfMonth', { valueAsNumber: true })}
            >
              {days.map((day) => (
                <option key={day} value={day}>
                  {businessDay ? `${day}º dia útil` : day}
                </option>
              ))}
            </SelectField>
            <Controller
              control={control}
              name="valueInCents"
              render={({ field }) => (
                <TextField
                  id="recurring-value"
                  label="Valor"
                  inputMode="numeric"
                  icon={<span className="text-sm font-medium">R$</span>}
                  value={formatAmount(field.value)}
                  onChange={(event) => field.onChange(parseAmount(event.target.value))}
                  onBlur={field.onBlur}
                  error={errors.valueInCents?.message}
                />
              )}
            />
          </div>
          {!recurrence && (
            <TextField
              id="recurring-start"
              label="A partir de"
              type="date"
              hint="Datas que já passaram também são lançadas"
              error={errors.startDate?.message}
              {...register('startDate')}
            />
          )}
          <SelectField
            id="recurring-category"
            label="Categoria"
            required
            error={errors.categoryId?.message}
            {...register('categoryId')}
          >
            <option value="" disabled>
              Selecione
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <p className="text-xs text-gray-500">
            {businessDay
              ? 'Conta de segunda a sexta e desconta os feriados nacionais do Brasil. Se o mês tiver menos dias úteis, usa o último dia útil.'
              : 'Nos meses mais curtos, os dias 29, 30 e 31 caem no último dia do mês.'}
          </p>
        </div>

        {errors.root?.message && <p className="text-sm text-red-base">{errors.root.message}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </Modal>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@apollo/client/react';
import { CircleArrowDown, CircleArrowUp } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  CREATE_RECURRING_TRANSACTION,
  CREATE_TRANSACTION,
  REFETCH_LISTS,
  UPDATE_TRANSACTION,
} from '@/graphql/operations';
import type { Category, Transaction, TransactionType } from '@/graphql/types';
import { errorCode } from '@/lib/errors';
import {
  dateInputToIso,
  formatAmount,
  isoToDateInput,
  parseAmount,
  todayDateInput,
} from '@/lib/format';
import { Button } from './ui/button';
import { SelectField, TextField } from './ui/field';
import { Modal } from './ui/modal';

const schema = z.object({
  type: z.enum(['expense', 'income']),
  description: z.string().trim().min(1, 'Informe a descrição').max(100, 'Máximo de 100 caracteres'),
  date: z.string().min(1, 'Selecione a data'),
  valueInCents: z.number().int().positive('Informe um valor maior que zero'),
  categoryId: z.string().min(1, 'Selecione a categoria'),
  // Só na criação: em vez de uma transação avulsa, cria uma recorrência mensal.
  repeat: z.boolean(),
  repeatDayType: z.enum(['calendar_day', 'business_day']),
  repeatBusinessDay: z.number().int().min(1).max(23),
});

type FormValues = z.infer<typeof schema>;

interface TransactionModalProps {
  categories: Category[];
  // Com transação, o modal edita; sem, cria.
  transaction?: Transaction | undefined;
  onClose(): void;
}

export function TransactionModal({ categories, transaction, onClose }: TransactionModalProps) {
  const [createTransaction] = useMutation(CREATE_TRANSACTION, { refetchQueries: REFETCH_LISTS });
  const [updateTransaction] = useMutation(UPDATE_TRANSACTION, { refetchQueries: REFETCH_LISTS });
  const [createRecurring] = useMutation(CREATE_RECURRING_TRANSACTION, {
    refetchQueries: REFETCH_LISTS,
  });

  const {
    register,
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: transaction
      ? {
          type: transaction.type,
          description: transaction.description,
          date: isoToDateInput(transaction.date),
          valueInCents: transaction.valueInCents,
          categoryId: transaction.categoryId,
          repeat: false,
          repeatDayType: 'calendar_day',
          repeatBusinessDay: 5,
        }
      : {
          type: 'expense',
          description: '',
          date: todayDateInput(),
          valueInCents: 0,
          categoryId: '',
          repeat: false,
          repeatDayType: 'calendar_day',
          repeatBusinessDay: 5,
        },
  });

  const repeat = watch('repeat');
  const repeatDay = Number(watch('date').slice(8, 10));
  const repeatDayType = watch('repeatDayType');
  const repeatBusinessDay = watch('repeatBusinessDay');

  async function onSubmit({ repeat, repeatDayType, repeatBusinessDay, ...values }: FormValues) {
    const data = { ...values, date: dateInputToIso(values.date) };
    try {
      if (repeat) {
        const { date, ...rest } = data;
        await createRecurring({
          variables: {
            data: {
              ...rest, dayType: repeatDayType,
              dayOfMonth: repeatDayType === 'business_day' ? repeatBusinessDay : Number(values.date.slice(8, 10)),
              startDate: date,
            },
          },
        });
      } else if (transaction) {
        await updateTransaction({ variables: { id: transaction.id, data } });
      } else {
        await createTransaction({ variables: { data } });
      }
      onClose();
    } catch (error) {
      setError('root', {
        message:
          errorCode(error) === 'NOT_FOUND'
            ? 'Essa categoria não está mais disponível. Escolha outra.'
            : 'Não foi possível salvar a transação. Tente novamente.',
      });
    }
  }

  return (
    <Modal
      title={transaction ? 'Editar transação' : 'Nova transação'}
      description="Registre sua despesa ou receita"
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
            id="transaction-description"
            label="Descrição"
            placeholder="Ex. Almoço no restaurante"
            error={errors.description?.message}
            {...register('description')}
          />
          <div className="flex flex-col gap-4 min-[400px]:flex-row [&>*]:min-w-0 [&>*]:flex-1">
            <TextField
              id="transaction-date"
              label="Data"
              type="date"
              error={errors.date?.message}
              {...register('date')}
            />
            <Controller
              control={control}
              name="valueInCents"
              render={({ field }) => (
                <TextField
                  id="transaction-value"
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
          <SelectField
            id="transaction-category"
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
          {categories.length === 0 && (
            <p className="text-xs text-gray-500">
              Crie uma categoria antes de registrar transações.
            </p>
          )}
          {!transaction && (
            <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-0.5 size-4 cursor-pointer accent-brand"
                {...register('repeat')}
              />
              <span className="flex flex-col gap-0.5">
                Repetir todo mês
                <span className="text-xs text-gray-500">
                  {repeat && repeatDayType === 'business_day'
                    ? `Lança no ${repeatBusinessDay}º dia útil de cada mês, a partir da data escolhida.`
                    : repeat && repeatDay
                    ? `Lança automaticamente todo dia ${repeatDay}. Ex.: salário, assinatura.`
                    : 'Ex.: salário, aluguel, assinatura.'}
                </span>
              </span>
            </label>
          )}
          {!transaction && repeat && (
            <div className="flex flex-col gap-4">
              <SelectField id="transaction-repeat-type" label="Repetir em" {...register('repeatDayType')}>
                <option value="calendar_day">Dia fixo do mês</option>
                <option value="business_day">Dia útil do mês</option>
              </SelectField>
              {repeatDayType === 'business_day' && (
                <>
                  <SelectField
                    id="transaction-repeat-business-day"
                    label="Qual dia útil?"
                    error={errors.repeatBusinessDay?.message}
                    {...register('repeatBusinessDay', { valueAsNumber: true })}
                  >
                    {Array.from({ length: 23 }, (_, index) => index + 1).map(day => (
                      <option key={day} value={day}>{day}º dia útil</option>
                    ))}
                  </SelectField>
                  <p className="text-xs text-gray-500">
                    Conta de segunda a sexta e desconta os feriados nacionais do Brasil.
                    Se o mês tiver menos dias úteis, usa o último dia útil.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {errors.root?.message && <p className="text-sm text-red-base">{errors.root.message}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </Modal>
  );
}

export function TypeOption({
  type,
  selected,
  onSelect,
}: {
  type: TransactionType;
  selected: boolean;
  onSelect(): void;
}) {
  const expense = type === 'expense';
  const Icon = expense ? CircleArrowDown : CircleArrowUp;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-lg border px-3 py-3.5 text-base transition-colors ${
        selected
          ? `bg-gray-100 font-medium text-gray-800 ${expense ? 'border-red-base' : 'border-green-base'}`
          : 'border-transparent text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon
        className={`size-4 ${selected ? (expense ? 'text-red-base' : 'text-green-base') : 'text-gray-400'}`}
      />
      {expense ? 'Despesa' : 'Receita'}
    </button>
  );
}

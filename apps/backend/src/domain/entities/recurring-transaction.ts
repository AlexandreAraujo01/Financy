import { Entity } from '@/domain/core/entity';
import { IRecurringTransaction, type RecurringDayType } from './props/recurring-transaction/recurring-transaction';
import { businessDaysInMonth } from './business-calendar';

// Datas de transação são guardadas ao meio-dia UTC, pra não "voltarem um dia" em fuso negativo.
export function occurrenceOn(
  year: number, monthIndex: number, dayOfMonth: number,
  dayType: RecurringDayType = 'calendar_day',
): Date {
  if (dayType === 'business_day') {
    const days = businessDaysInMonth(year, monthIndex);
    // Como no dia 31 de um mês curto: usa o último dia útil quando há menos dias.
    return days[Math.min(dayOfMonth, days.length) - 1]!;
  }
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, monthIndex, Math.min(dayOfMonth, lastDay), 12));
}

export function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12));
}

export class RecurringTransaction extends Entity<IRecurringTransaction> {
  protected constructor(data: IRecurringTransaction, id?: string, createdAt?: Date) {
    super(data, id, createdAt);
  }

  static create(
    data: Omit<IRecurringTransaction, 'dayType'> & { dayType?: RecurringDayType },
    id?: string, createdAt?: Date,
  ) {
    return new RecurringTransaction(
      {
        ...data,
        dayType: data.dayType ?? 'calendar_day',
        description: data.description.trim(),
        startDate: startOfDay(data.startDate),
      },
      id,
      createdAt,
    );
  }

  // Primeira ocorrência no dia escolhido a partir de startDate (no mesmo mês, se ainda não passou).
  static firstOccurrence(startDate: Date, dayOfMonth: number, dayType: RecurringDayType = 'calendar_day'): Date {
    const start = startOfDay(startDate);
    const sameMonth = occurrenceOn(start.getUTCFullYear(), start.getUTCMonth(), dayOfMonth, dayType);
    return sameMonth >= start
      ? sameMonth
      : occurrenceOn(start.getUTCFullYear(), start.getUTCMonth() + 1, dayOfMonth, dayType);
  }

  get isActive(): boolean {
    return this.props.status === 'active';
  }

  // Ocorrência do mês seguinte ao de `date`, no dia da recorrência.
  occurrenceAfter(date: Date): Date {
    return occurrenceOn(date.getUTCFullYear(), date.getUTCMonth() + 1, this.props.dayOfMonth, this.props.dayType);
  }

  // Ocorrências vencidas ainda não geradas, de nextDueDate até hoje (inclusive).
  dueDates(today: Date): Date[] {
    if (!this.isActive) return [];
    const limit = startOfDay(today);
    const dates: Date[] = [];
    for (let date = this.props.nextDueDate; date <= limit; date = this.occurrenceAfter(date)) {
      dates.push(date);
    }
    return dates;
  }
}

import { describe, expect, it } from 'vitest';
import { uuidv7 } from 'uuidv7';
import { occurrenceOn, RecurringTransaction } from '../recurring-transaction';

const day = (iso: string) => new Date(`${iso}T12:00:00.000Z`);
const isoDays = (dates: Date[]) => dates.map((d) => d.toISOString().slice(0, 10));

const make = (dayOfMonth: number, nextDueDate: string, status: 'active' | 'ended' = 'active') =>
  RecurringTransaction.create({
    userId: uuidv7(),
    categoryId: uuidv7(),
    description: '  Netflix  ',
    type: 'expense',
    valueInCents: 5590,
    dayOfMonth,
    startDate: day(nextDueDate),
    nextDueDate: day(nextDueDate),
    status,
  });

describe('RecurringTransaction unit test', () => {
  it('should keep old recurrences on calendar days by default', () => {
    expect(make(5, '2026-11-05').toSnapshot().dayType).toBe('calendar_day');
  });

  it.each([
    [2026, 0, 5, '2026-01-08'], // Ano Novo.
    [2026, 4, 5, '2026-05-08'], // Dia do Trabalho em uma sexta-feira.
    [2026, 6, 5, '2026-07-07'], // Dia 5 em um domingo.
    [2026, 8, 5, '2026-09-08'], // Independência na segunda-feira.
    [2026, 10, 5, '2026-11-09'], // Finados na segunda-feira.
    [2026, 11, 5, '2026-12-07'],
    [2026, 12, 5, '2027-01-08'],
    [2028, 1, 5, '2028-02-07'],
    [2026, 1, 23, '2026-02-27'], // Mês com menos de 23 dias úteis.
    [2028, 1, 23, '2028-02-29'], // Fevereiro bissexto.
    [2026, 3, 3, '2026-04-06'], // Sexta-Feira Santa em 3 de abril.
    [2027, 2, 20, '2027-03-29'], // Sexta-Feira Santa muda de data em 2027.
    [2025, 2, 5, '2025-03-07'], // Carnaval é ponto facultativo, não feriado nacional.
    [2026, 6, 7, '2026-07-09'], // Feriado estadual de SP não entra.
  ])('business occurrence (%i, %i, %i) should be %s', (year, month, number, expected) => {
    expect(occurrenceOn(year, month, number, 'business_day')).toEqual(day(expected));
  });

  it.each([
    ['2026-11-01', '2026-11-09'],
    ['2026-11-09', '2026-11-09'],
    ['2026-11-10', '2026-12-07'],
  ])('should find the first fifth business day from %s', (start, expected) => {
    expect(RecurringTransaction.firstOccurrence(day(start), 5, 'business_day')).toEqual(day(expected));
  });

  it('should recalculate the fifth business day for every month when catching up', () => {
    const recurrence = RecurringTransaction.create({
      ...make(5, '2026-09-08').toSnapshot(), dayType: 'business_day',
    });
    expect(isoDays(recurrence.dueDates(day('2027-01-08')))).toEqual([
      '2026-09-08', '2026-10-07', '2026-11-09', '2026-12-07', '2027-01-08',
    ]);
  });

  it('should trim the description', () => {
    expect(make(10, '2026-11-10').toSnapshot().description).toBe('Netflix');
  });

  it.each([
    [2026, 1, 31, '2026-02-28'],
    [2028, 1, 31, '2028-02-29'],
    [2026, 3, 31, '2026-04-30'],
    [2026, 11, 31, '2026-12-31'],
    [2026, 12, 15, '2027-01-15'],
  ])('occurrenceOn(%i, %i, %i) should be %s', (year, monthIndex, dayOfMonth, expected) => {
    expect(isoDays([occurrenceOn(year, monthIndex, dayOfMonth)])).toEqual([expected]);
  });

  it('should start in the same month when the day has not passed yet', () => {
    expect(isoDays([RecurringTransaction.firstOccurrence(day('2026-11-03'), 5)])).toEqual([
      '2026-11-05',
    ]);
  });

  it('should start on the start date itself when it is the chosen day', () => {
    expect(isoDays([RecurringTransaction.firstOccurrence(day('2026-11-05'), 5)])).toEqual([
      '2026-11-05',
    ]);
  });

  it('should start next month when the day already passed', () => {
    expect(isoDays([RecurringTransaction.firstOccurrence(day('2026-11-21'), 5)])).toEqual([
      '2026-12-05',
    ]);
  });

  it('should list every missed month up to today, inclusive', () => {
    const recurrence = make(5, '2026-08-05');

    expect(isoDays(recurrence.dueDates(new Date('2026-11-05T09:00:00.000Z')))).toEqual([
      '2026-08-05',
      '2026-09-05',
      '2026-10-05',
      '2026-11-05',
    ]);
  });

  it('should keep the chosen day after a short month', () => {
    const recurrence = make(31, '2026-01-31');

    expect(isoDays(recurrence.dueDates(day('2026-04-30')))).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
    ]);
  });

  it('should have nothing due before the next date', () => {
    expect(make(25, '2026-11-25').dueDates(day('2026-11-24'))).toEqual([]);
  });

  it('should have nothing due once ended', () => {
    expect(make(5, '2026-08-05', 'ended').dueDates(day('2026-11-21'))).toEqual([]);
  });
});

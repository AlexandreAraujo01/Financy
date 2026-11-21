export const RECURRENCE_TIMEZONE = 'America/Sao_Paulo';

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: RECURRENCE_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});

// O calendário usa datas ao meio-dia UTC. O "hoje" vem do dia em São Paulo,
// inclusive quando o servidor está em UTC e ainda é o dia anterior no Brasil.
export function recurrenceDay(now: Date): Date {
  const parts = formatter.formatToParts(now);
  const value = (type: string) => Number(parts.find(part => part.type === type)!.value);
  return new Date(Date.UTC(value('year'), value('month') - 1, value('day'), 12));
}

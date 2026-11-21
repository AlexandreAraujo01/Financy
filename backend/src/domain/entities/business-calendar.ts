import Holidays from 'date-holidays';

// Somente feriados nacionais do Brasil; pontos facultativos e feriados locais
// ficam fora. Regras fixas e móveis são calculadas offline pela biblioteca.
// Referência do calendário: https://www.gov.br/servidor/pt-br/assuntos/noticias/2026/junho/portaria-do-mgi-estabelece-ponto-facultativo-no-dia-5-de-junho-para-os-orgaos-da-administracao-publica-federal/
const calendar = new Holidays('BR', { types: ['public'], timezone: 'America/Sao_Paulo' });
const holidayDates = new Map<number, Set<string>>();

export function businessDaysInMonth(year: number, monthIndex: number): Date[] {
  // Normaliza também a passagem de dezembro para janeiro.
  const first = new Date(Date.UTC(year, monthIndex, 1, 12));
  const actualYear = first.getUTCFullYear();
  const actualMonth = first.getUTCMonth();
  let holidays = holidayDates.get(actualYear);
  if (!holidays) {
    // Datas locais do calendário: não dependem do fuso horário da máquina.
    holidays = new Set(calendar.getHolidays(actualYear).map(holiday => holiday.date.slice(0, 10)));
    if (holidayDates.size >= 128) holidayDates.delete(holidayDates.keys().next().value!);
    holidayDates.set(actualYear, holidays);
  }

  const lastDay = new Date(Date.UTC(actualYear, actualMonth + 1, 0)).getUTCDate();
  const days: Date[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(Date.UTC(actualYear, actualMonth, day, 12));
    const weekday = date.getUTCDay();
    if (weekday !== 0 && weekday !== 6 && !holidays.has(date.toISOString().slice(0, 10))) days.push(date);
  }
  return days;
}

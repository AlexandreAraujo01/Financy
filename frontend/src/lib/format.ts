const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const number = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// O backend guarda tudo em centavos: 15050 = R$ 150,50.
export function formatCurrency(cents: number): string {
  // Intl usa espaço não separável depois do "R$"; o design usa espaço comum.
  return currency.format(cents / 100).replace(/ /g, ' ');
}

// "0,00" do campo de valor, sem o "R$".
export function formatAmount(cents: number): string {
  return number.format(cents / 100);
}

// Campo de valor estilo caixa eletrônico: os dígitos digitados empurram os centavos.
export function parseAmount(text: string): number {
  const digits = text.replace(/\D/g, '').slice(0, 10);
  return digits ? Number(digits) : 0;
}

// 2026-11-30T12:00:00Z → 30/11/26 (sempre em UTC, que é como a data foi salva).
export function formatShortDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year?.slice(2)}`;
}

// Valor de <input type="date"> (2026-11-30) ↔ ISO salvo no backend (meio-dia UTC,
// pra data não "voltar um dia" em fuso negativo).
export function dateInputToIso(value: string): string {
  return `${value}T12:00:00.000Z`;
}

export function isoToDateInput(iso: string): string {
  return iso.slice(0, 10);
}

export function todayDateInput(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function pluralItems(count: number): string {
  return `${count} ${count === 1 ? 'item' : 'itens'}`;
}

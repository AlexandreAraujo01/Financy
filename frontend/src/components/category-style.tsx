import {
  BaggageClaim,
  BookOpen,
  BriefcaseBusiness,
  CarFront,
  Dumbbell,
  Gift,
  HeartPulse,
  House,
  Mailbox,
  PawPrint,
  PiggyBank,
  ReceiptText,
  ShoppingCart,
  Tag as TagIcon,
  Ticket,
  ToolCase,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryColor, CategoryIcon } from '@/graphql/types';

// Mesma ordem do seletor de ícones no design.
export const CATEGORY_ICONS: Record<CategoryIcon, LucideIcon> = {
  briefcase_business: BriefcaseBusiness,
  car_front: CarFront,
  heart_pulse: HeartPulse,
  piggy_bank: PiggyBank,
  shopping_cart: ShoppingCart,
  ticket: Ticket,
  tool_case: ToolCase,
  utensils: Utensils,
  paw_print: PawPrint,
  house: House,
  gift: Gift,
  dumbbell: Dumbbell,
  book_open: BookOpen,
  baggage_claim: BaggageClaim,
  mailbox: Mailbox,
  receipt_text: ReceiptText,
};

// Classes completas (não montadas por string) pro Tailwind encontrar.
export const CATEGORY_COLORS: Record<
  CategoryColor,
  { light: string; text: string; swatch: string }
> = {
  green: { light: 'bg-green-light', text: 'text-green-dark', swatch: 'bg-green-base' },
  blue: { light: 'bg-blue-light', text: 'text-blue-dark', swatch: 'bg-blue-base' },
  purple: { light: 'bg-purple-light', text: 'text-purple-dark', swatch: 'bg-purple-base' },
  pink: { light: 'bg-pink-light', text: 'text-pink-dark', swatch: 'bg-pink-base' },
  red: { light: 'bg-red-light', text: 'text-red-dark', swatch: 'bg-red-base' },
  orange: { light: 'bg-orange-light', text: 'text-orange-dark', swatch: 'bg-orange-base' },
  yellow: { light: 'bg-yellow-light', text: 'text-yellow-dark', swatch: 'bg-yellow-base' },
};

interface Look {
  icon?: CategoryIcon | undefined;
  color?: CategoryColor | undefined;
}

// Transação cuja categoria foi excluída ainda aparece: fica com ícone e cor neutros.
const NEUTRAL = { light: 'bg-gray-200', text: 'text-gray-600', swatch: 'bg-gray-400' };

export function CategoryBadge({ icon, color }: Look) {
  const Icon = icon ? CATEGORY_ICONS[icon] : TagIcon;
  const style = color ? CATEGORY_COLORS[color] : NEUTRAL;
  return (
    <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${style.light}`}>
      <Icon className={`size-4 ${style.text}`} />
    </span>
  );
}

export function CategoryTag({ name, color }: { name: string; color?: CategoryColor | undefined }) {
  const style = color ? CATEGORY_COLORS[color] : NEUTRAL;
  return (
    <span
      title={name}
      className={`inline-flex min-w-0 max-w-full items-center rounded-full px-3 py-1 align-middle text-sm font-medium ${style.light} ${style.text}`}
    >
      <span className="min-w-0 truncate">{name}</span>
    </span>
  );
}

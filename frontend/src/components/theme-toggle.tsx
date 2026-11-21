import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/theme';
import { IconButton } from './ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <IconButton
      label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      onClick={toggleTheme}
      className="size-10"
    >
      {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </IconButton>
  );
}

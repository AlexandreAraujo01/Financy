import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { IconButton } from './button';

interface ModalProps {
  title: string;
  description: string;
  onClose(): void;
  children: ReactNode;
}

export function Modal({ title, description, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]',
      );
      const first = focusable?.[0];
      const last = focusable?.[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role="dialog"
        ref={dialogRef}
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[448px] flex-col gap-6 overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-surface p-4 outline-none sm:max-h-[calc(100dvh-2rem)] sm:p-[25px]"
      >
        <header className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2 id="modal-title" className="text-base font-semibold text-gray-800">
              {title}
            </h2>
            <p id="modal-description" className="text-sm text-gray-600">{description}</p>
          </div>
          <IconButton label="Fechar" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </header>
        {children}
      </div>
    </div>
  );
}

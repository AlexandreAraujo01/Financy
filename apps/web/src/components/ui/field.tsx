import { ChevronDown } from 'lucide-react';
import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';

const box =
  'flex h-[50px] w-full items-center gap-3 rounded-lg border bg-surface px-[13px] transition-colors focus-within:border-brand-foreground';

interface FieldShellProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

function FieldShell({ label, htmlFor, hint, error, children }: FieldShellProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-base">{error}</p>
      ) : hint ? (
        <p className="text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  hint?: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, id, icon, trailing, hint, error, disabled, ...props },
  ref,
) {
  return (
    <FieldShell label={label} htmlFor={id} hint={hint} error={error}>
      <div
        className={`${box} ${error ? 'border-red-base' : 'border-gray-300'} ${disabled ? 'bg-gray-100' : ''}`}
      >
        {icon && <span className="shrink-0 text-gray-400 [&>svg]:size-4">{icon}</span>}
        <input
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className="min-w-0 flex-1 bg-transparent text-base text-gray-800 outline-none placeholder:text-gray-400 disabled:text-gray-500"
          {...props}
        />
        {trailing}
      </div>
    </FieldShell>
  );
});

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  error?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, id, error, children, ...props },
  ref,
) {
  return (
    <FieldShell label={label} htmlFor={id} error={error}>
      <div className={`${box} relative ${error ? 'border-red-base' : 'border-gray-300'}`}>
        <select
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-6 text-base text-gray-800 outline-none invalid:text-gray-400"
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-[13px] size-4 text-gray-700" />
      </div>
    </FieldShell>
  );
});

import { Eye, EyeClosed, Lock } from 'lucide-react';
import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { TextField } from './ui/field';

interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  hint?: string;
  error?: string | undefined;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <TextField
        ref={ref}
        label="Senha"
        type={visible ? 'text' : 'password'}
        placeholder="Digite sua senha"
        icon={<Lock />}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? 'Esconder senha' : 'Mostrar senha'}
            className="cursor-pointer text-gray-700"
          >
            {visible ? <Eye className="size-4" /> : <EyeClosed className="size-4" />}
          </button>
        }
        {...props}
      />
    );
  },
);

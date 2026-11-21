import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, Mail, UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { z } from 'zod';
import { AuthLayout, OrDivider } from '@/components/auth-layout';
import { PasswordField } from '@/components/password-field';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { useAuth } from '@/contexts/auth';
import { errorCode } from '@/lib/errors';

// Mesmas regras do backend (create-user-input).
const schema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome').max(100, 'Máximo de 100 caracteres'),
  email: z.email('Informe um e-mail válido'),
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .max(72, 'Máximo de 72 caracteres'),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: signUp } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  });

  async function onSubmit(values: FormValues) {
    try {
      await signUp(values);
    } catch (error) {
      if (errorCode(error) === 'CONFLICT') {
        setError('email', { message: 'Já existe uma conta com esse e-mail' });
      } else {
        setError('root', { message: 'Não foi possível criar a conta. Tente novamente.' });
      }
    }
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Comece a controlar suas finanças ainda hoje">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <div className="flex flex-col gap-4">
          <TextField
            id="register-name"
            label="Nome completo"
            autoComplete="name"
            placeholder="Seu nome completo"
            icon={<UserRound />}
            error={errors.name?.message}
            {...register('name')}
          />
          <TextField
            id="register-email"
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="mail@exemplo.com"
            icon={<Mail />}
            error={errors.email?.message}
            {...register('email')}
          />
          <PasswordField
            id="register-password"
            autoComplete="new-password"
            hint="A senha deve ter no mínimo 8 caracteres"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        {errors.root?.message && (
          <p role="alert" className="text-sm text-red-base">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
        </Button>

        <OrDivider />

        <div className="flex flex-col gap-4">
          <p className="text-center text-sm text-gray-600">Já tem uma conta?</p>
          <Link
            to="/login"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-surface text-base font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            <LogIn className="size-[18px]" />
            Fazer login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

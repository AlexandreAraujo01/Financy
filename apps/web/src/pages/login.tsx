import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, UserRoundPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { z } from 'zod';
import { AuthLayout, OrDivider } from '@/components/auth-layout';
import { PasswordField } from '@/components/password-field';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { useAuth } from '@/contexts/auth';
import { errorCode } from '@/lib/errors';

const schema = z.object({
  email: z.email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe a senha'),
  remember: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: true },
  });

  async function onSubmit({ remember, ...credentials }: FormValues) {
    try {
      await login(credentials, remember);
    } catch (error) {
      setError('root', {
        message:
          errorCode(error) === 'UNAUTHENTICATED'
            ? 'E-mail ou senha incorretos'
            : 'Não foi possível entrar. Tente novamente.',
      });
    }
  }

  return (
    <AuthLayout title="Fazer login" subtitle="Entre na sua conta para continuar">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <div className="flex flex-col gap-4">
          <TextField
            id="login-email"
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="mail@exemplo.com"
            icon={<Mail />}
            error={errors.email?.message}
            {...register('email')}
          />
          <PasswordField
            id="login-password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="size-4 cursor-pointer rounded accent-brand"
                {...register('remember')}
              />
              Lembrar-me
            </label>
            {/* O backend ainda não tem recuperação de senha. */}
            <span
              className="cursor-not-allowed text-sm font-medium text-brand-foreground opacity-60"
              title="Em breve"
            >
              Recuperar senha
            </span>
          </div>
        </div>

        {errors.root?.message && (
          <p role="alert" className="text-sm text-red-base">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>

        <OrDivider />

        <div className="flex flex-col gap-4">
          <p className="text-center text-sm text-gray-600">Ainda não tem uma conta?</p>
          <Link
            to="/cadastro"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-surface text-base font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            <UserRoundPlus className="size-[18px]" />
            Criar conta
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

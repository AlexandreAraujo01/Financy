import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@apollo/client/react';
import { LogOut, Mail, UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/field';
import { useAuth } from '@/contexts/auth';
import { UPDATE_ME } from '@/graphql/operations';

const schema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome').max(100, 'Máximo de 100 caracteres'),
});

type FormValues = z.infer<typeof schema>;

export function ProfilePage() {
  const { user, logout } = useAuth();
  const [updateMe] = useMutation(UPDATE_ME);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty, isSubmitSuccessful },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: { name: user?.name ?? '' },
  });

  if (!user) return null;

  async function onSubmit(values: FormValues) {
    try {
      const { data } = await updateMe({ variables: { data: values } });
      // O cache do Apollo atualiza o `me` sozinho (mesmo id); só zera o "alterado".
      if (data) reset({ name: data.updateMe.name });
    } catch {
      setError('root', { message: 'Não foi possível salvar. Tente novamente.' });
    }
  }

  return (
    <Card className="mx-auto flex w-full max-w-[448px] flex-col gap-8 p-5 sm:p-8">
      <div className="flex flex-col items-center gap-6 border-b border-gray-200 pb-8">
        <Avatar name={user.name} size="lg" />
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="break-all text-xl font-semibold text-gray-800">{user.name}</h1>
          <p className="break-all text-base text-gray-500">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8" noValidate>
        <div className="flex flex-col gap-4">
          <TextField
            id="profile-name"
            label="Nome completo"
            icon={<UserRound className="text-gray-800" />}
            error={errors.name?.message}
            {...register('name')}
          />
          <TextField
            id="profile-email"
            label="E-mail"
            icon={<Mail />}
            value={user.email}
            disabled
            readOnly
            hint="O e-mail não pode ser alterado"
          />
        </div>

        {errors.root?.message && <p className="text-sm text-red-base">{errors.root.message}</p>}
        {isSubmitSuccessful && !isDirty && !errors.root && (
          <p role="status" className="text-sm text-green-dark">
            Alterações salvas.
          </p>
        )}

        <div className="flex flex-col gap-4">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
          </Button>
          <Button type="button" variant="outline" onClick={() => logout()}>
            <LogOut className="size-[18px] text-red-base" />
            Sair da conta
          </Button>
        </div>
      </form>
    </Card>
  );
}

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/shared/lib/auth/auth.validators';
import { applyFieldErrors } from '@/shared/hooks/use-server-action';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { resetPasswordAction } from '../actions/password-reset.action';

export function ResetPasswordForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  });

  function onSubmit(values: ResetPasswordInput) {
    startTransition(async () => {
      const result = await resetPasswordAction({ ...values, email });
      if (!result.success) {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/login'), 1500);
    });
  }

  if (done) {
    return (
      <div className="bg-muted/30 flex flex-col items-center gap-3 rounded-xl border p-6 text-center">
        <CheckCircle2 className="text-success size-8" />
        <p className="font-medium">{t('reset.doneTitle')}</p>
        <p className="text-muted-foreground text-sm">{t('reset.doneBody')}</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('reset.newPasswordLabel')}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('reset.newPasswordPlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('reset.confirmLabel')}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('reset.confirmPlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" loading={isPending}>
          {t('reset.submit')}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            {t('reset.backToSignIn')}
          </Link>
        </p>
      </form>
    </Form>
  );
}

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/shared/lib/auth/auth.validators';
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
import { forgotPasswordAction } from '../actions/password-reset.action';

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  function onSubmit(values: ForgotPasswordInput) {
    startTransition(async () => {
      await forgotPasswordAction(values);
      // Always show success — we never disclose whether the email exists.
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-muted/30 p-6 text-center">
        <CheckCircle2 className="size-8 text-success" />
        <div className="space-y-1">
          <p className="font-medium">{t('forgot.sentTitle')}</p>
          <p className="text-sm text-muted-foreground">
            {t('forgot.sentBody')}
          </p>
        </div>
        <Button variant="outline" asChild className="mt-2">
          <Link href="/login">{t('forgot.backToSignIn')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('emailLabel')}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={t('emailPlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" loading={isPending}>
          {t('forgot.submit')}
        </Button>
      </form>
    </Form>
  );
}

'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from '../validators/settings.validators';
import { updateProfileAction } from '../actions/settings.actions';
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
import { Label } from '@/shared/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { AvatarUploader } from './avatar-uploader';
import { SignatureUploader } from './signature-uploader';

export function ProfileForm({
  defaultValues,
  email,
  image,
  signatureUrl,
}: {
  defaultValues: UpdateProfileInput;
  email: string;
  image?: string | null;
  signatureUrl?: string | null;
}) {
  const t = useTranslations('settings');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
  });

  function onSubmit(values: UpdateProfileInput) {
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (!result.success) {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
        return;
      }
      toast.success(t('profileUpdated'));
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('photo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <AvatarUploader name={form.watch('name')} image={image} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('signature')}</CardTitle>
          </CardHeader>
          <CardContent>
            <SignatureUploader signatureUrl={signatureUrl} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('identity')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fullName')}</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-1.5">
              <Label>{t('email')}</Label>
              <Input value={email} disabled />
              <p className="text-muted-foreground text-xs">{t('emailHint')}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={isPending}>
            {t('save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

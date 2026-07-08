'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  updatePreferencesSchema,
  type UpdatePreferencesInput,
} from '../validators/settings.validators';
import { updatePreferencesAction } from '../actions/settings.actions';
import { applyFieldErrors } from '@/shared/hooks/use-server-action';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

export function PreferencesForm({
  defaultValues,
}: {
  defaultValues: UpdatePreferencesInput;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdatePreferencesInput>({
    resolver: zodResolver(updatePreferencesSchema),
    defaultValues,
  });

  function onSubmit(values: UpdatePreferencesInput) {
    startTransition(async () => {
      const result = await updatePreferencesAction(values);
      if (!result.success) {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
        return;
      }
      toast.success('Preferences updated.');
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formatting</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input placeholder="USD" maxLength={3} {...field} />
                  </FormControl>
                  <FormDescription>ISO 4217 code.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="locale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Locale</FormLabel>
                  <FormControl>
                    <Input placeholder="en" {...field} />
                  </FormControl>
                  <FormDescription>e.g. en, es, en-US.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <FormControl>
                    <Input placeholder="America/Santo_Domingo" {...field} />
                  </FormControl>
                  <FormDescription>IANA identifier.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Form>
  );
}

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Building2 } from 'lucide-react';
import type { Plan } from '@/generated/prisma/enums';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';

/** Replaces a create form once the plan's limit is used up, so the owner learns it before typing, not on save. */
export async function PlanLimitNotice({
  plan,
  limit,
}: {
  plan: Plan;
  limit: number;
}) {
  const [t, tp] = await Promise.all([
    getTranslations('billing.limitReached'),
    getTranslations('plans'),
  ]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
          <Building2 className="size-6" />
        </span>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{t('title')}</h2>
          <p className="text-muted-foreground mx-auto max-w-md text-sm">
            {t('description', { plan: tp(`${plan}.name`), limit })}
          </p>
        </div>
        <Button asChild>
          <Link href="/app/billing">{t('cta')}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Mail, Pencil, Phone, ShieldAlert, IdCard } from 'lucide-react';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { NotFoundError } from '@/shared/lib/errors';
import { tenantService } from '@/features/tenants/services/tenant.service';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { TenantAvatarUpload } from '@/features/tenants/components/tenant-avatar-upload';
import { getInitials } from '@/shared/lib/format';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('tenant') };
}

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ownerId = await requireOwnerId();
  const { id } = await params;

  const tenant = await tenantService.getById(ownerId, id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  const t = await getTranslations('tenants.detail');
  const fullName = `${tenant.firstName} ${tenant.lastName}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        description={t('summary', {
          contracts: tenant._count.contracts,
          payments: tenant._count.payments,
        })}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/app/tenants/${tenant.id}/edit`}>
              <Pencil className="size-4" /> {t('edit')}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <TenantAvatarUpload
              tenantId={tenant.id}
              avatarUrl={tenant.avatarUrl}
              initials={getInitials(fullName)}
            />
            <div>
              <p className="font-semibold">{fullName}</p>
              {tenant.email ? (
                <p className="text-sm text-muted-foreground">{tenant.email}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('contactInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row icon={Mail} label={t('email')} value={tenant.email} />
              <Row icon={Phone} label={t('phone')} value={tenant.phone} />
              <Row
                icon={IdCard}
                label={t('identification')}
                value={tenant.identification}
              />
            </CardContent>
          </Card>

          {tenant.emergencyName || tenant.emergencyPhone ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t('emergencyContact')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row
                  icon={ShieldAlert}
                  label={tenant.emergencyRelation ?? t('contact')}
                  value={tenant.emergencyName}
                />
                <Row
                  icon={Phone}
                  label={t('phone')}
                  value={tenant.emergencyPhone}
                />
              </CardContent>
            </Card>
          ) : null}

          {tenant.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('notes')}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-foreground/90">
                {tenant.notes}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" /> {label}
      </span>
      <span className="font-medium">{value || '—'}</span>
    </div>
  );
}

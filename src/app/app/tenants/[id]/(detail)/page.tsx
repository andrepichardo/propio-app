import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
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
import { formatPhone, getInitials } from '@/shared/lib/format';

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
  const formatter = await getFormatter();
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
        <Card className="flex flex-col">
          <CardContent className="flex h-full flex-col items-center gap-4 p-6 text-center">
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <TenantAvatarUpload
                tenantId={tenant.id}
                avatarUrl={tenant.avatarUrl}
                initials={getInitials(fullName)}
              />
              <div className="space-y-0.5">
                <p className="font-semibold">{fullName}</p>
                {tenant.email ? (
                  <p className="text-muted-foreground text-sm">
                    {tenant.email}
                  </p>
                ) : null}
                {tenant.phone ? (
                  <p className="text-muted-foreground text-sm">
                    {formatPhone(tenant.phone)}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="grid w-full grid-cols-3 gap-2 border-t pt-4">
              <Stat
                value={tenant._count.contracts}
                label={t('stats.contracts')}
                href={`/app/contracts?tenantId=${tenant.id}`}
              />
              <Stat
                value={tenant._count.payments}
                label={t('stats.payments')}
                href={`/app/payments?tenantId=${tenant.id}`}
              />
              <Stat
                value={tenant._count.documents}
                label={t('stats.documents')}
                href={`/app/documents?tenantId=${tenant.id}`}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {t('since', {
                date: formatter.dateTime(tenant.createdAt, {
                  dateStyle: 'medium',
                }),
              })}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('contactInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row icon={Mail} label={t('email')} value={tenant.email} />
              <Row
                icon={Phone}
                label={t('phone')}
                value={tenant.phone ? formatPhone(tenant.phone) : null}
              />
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
                  value={
                    tenant.emergencyPhone
                      ? formatPhone(tenant.emergencyPhone)
                      : null
                  }
                />
              </CardContent>
            </Card>
          ) : null}

          {tenant.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('notes')}</CardTitle>
              </CardHeader>
              <CardContent className="text-foreground/90 text-sm leading-relaxed">
                {tenant.notes}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  href,
}: {
  value: number;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-muted/40 hover:bg-muted rounded-lg px-2 py-2.5 text-center transition-colors"
    >
      <p className="text-lg leading-none font-semibold">{value}</p>
      <p className="text-muted-foreground mt-1 truncate text-xs">{label}</p>
    </Link>
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
      <span className="text-muted-foreground inline-flex items-center gap-2">
        <Icon className="size-4" /> {label}
      </span>
      <span className="font-medium">{value || '—'}</span>
    </div>
  );
}

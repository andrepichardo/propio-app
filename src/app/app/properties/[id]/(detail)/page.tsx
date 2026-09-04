import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import {
  Building2,
  FileSignature,
  FolderClosed,
  MapPin,
  Pencil,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import { requireOwnerId } from '@/shared/lib/auth/session';
import { NotFoundError } from '@/shared/lib/errors';
import { propertyService } from '@/features/properties/services/property.service';
import { PropertyStatusBadge } from '@/features/properties/components/property-status-badge';
import { DeletePropertyDialog } from '@/features/properties/components/delete-property-dialog';
import { PropertyPhotos } from '@/features/properties/components/property-photos';
import { PROPERTY_AMENITIES } from '@/features/properties/constants';
import { PageHeader } from '@/shared/components/page-header';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { getFormatDate } from '@/shared/lib/date-format.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('property') };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ownerId = await requireOwnerId();
  const { id } = await params;

  const property = await propertyService.getById(ownerId, id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  const t = await getTranslations('properties');
  const formatDate = await getFormatDate();

  const location = [
    property.addressLine,
    property.city,
    property.state,
    property.country,
  ]
    .filter(Boolean)
    .join(', ');

  const stats = [
    {
      label: t('detail.contracts'),
      value: property._count.contracts,
      icon: FileSignature,
      href: `/app/contracts?propertyId=${property.id}`,
    },
    {
      label: t('detail.documents'),
      value: property._count.documents,
      icon: FolderClosed,
      href: `/app/documents?propertyId=${property.id}`,
    },
    {
      label: t('detail.expenses'),
      value: property._count.expenses,
      icon: ReceiptIcon,
      href: `/app/expenses?propertyId=${property.id}`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.name}
        description={t(`types.${property.type}`)}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/app/properties/${property.id}/edit`}>
                <Pencil className="size-4" /> {t('detail.edit')}
              </Link>
            </Button>
            <DeletePropertyDialog
              propertyId={property.id}
              propertyName={property.name}
            />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <div className="bg-muted relative aspect-video">
            {property.coverImageUrl ? (
              <Image
                src={property.coverImageUrl}
                alt={property.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Building2 className="text-muted-foreground/40 size-12" />
              </div>
            )}
            <div className="absolute top-4 left-4">
              <PropertyStatusBadge status={property.status} />
            </div>
          </div>
          <CardContent className="space-y-4 p-6">
            <div className="text-muted-foreground flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span>{location || t('noLocation')}</span>
            </div>
            {property.description ? (
              <p className="text-foreground/90 text-sm leading-relaxed">
                {property.description}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                {t('detail.noDescription')}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              {t('detail.added', { date: formatDate(property.createdAt) })}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <Link key={stat.label} href={stat.href} className="group">
                <Card className="group-hover:border-primary/40 group-hover:bg-muted/40 transition-colors">
                  <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
                    <stat.icon className="text-muted-foreground group-hover:text-primary size-5 transition-colors" />
                    <p className="text-xl font-semibold">{stat.value}</p>
                    <p className="text-muted-foreground text-xs">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Card>
            <CardContent className="space-y-3 p-6 text-sm">
              <Detail
                label={t('detail.bedrooms')}
                value={property.bedrooms ?? '—'}
              />
              <Detail
                label={t('detail.bathrooms')}
                value={property.bathrooms ?? '—'}
              />
              <Detail
                label={t('detail.area')}
                value={property.areaSqm ? `${property.areaSqm} m²` : '—'}
              />
              <Detail
                label={t('detail.furnishing')}
                value={t(`furnishing.${property.furnishing}`)}
              />
              <Detail
                label={t('detail.parkingSpaces')}
                value={property.parkingSpaces ?? '—'}
              />
              {PROPERTY_AMENITIES.some((a) => property[a]) && (
                <div className="flex flex-wrap gap-1.5 border-t pt-3">
                  {PROPERTY_AMENITIES.filter((a) => property[a]).map((a) => (
                    <Badge key={a} variant="secondary">
                      {t(`amenities.${a}`)}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PropertyPhotos
        propertyId={property.id}
        photos={property.photos.map((photo) => ({
          id: photo.id,
          url: photo.url,
          caption: photo.caption,
          createdAt: photo.createdAt,
        }))}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

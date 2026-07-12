import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Building2, MapPin, FileSignature } from 'lucide-react';
import type { PropertyListItem } from '../repositories/property.repository';
import { PropertyStatusBadge } from './property-status-badge';
import { Card } from '@/shared/components/ui/card';

export function PropertyCard({ property }: { property: PropertyListItem }) {
  const t = useTranslations('properties');
  const location = [property.city, property.country]
    .filter(Boolean)
    .join(', ');

  return (
    <Link href={`/app/properties/${property.id}`} className="group block">
      <Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-card">
        <div className="relative aspect-[16/10] bg-muted">
          {property.coverImageUrl ? (
            <Image
              src={property.coverImageUrl}
              alt={property.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="size-9 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute right-3 top-3">
            <PropertyStatusBadge status={property.status} />
          </div>
        </div>
        <div className="space-y-2 p-4">
          <div className="space-y-0.5">
            <h3 className="truncate font-medium group-hover:text-primary">
              {property.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t(`types.${property.type}`)}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="size-3.5 shrink-0" />
              {location || t('noLocation')}
            </span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <FileSignature className="size-3.5" />
              {property._count.contracts}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

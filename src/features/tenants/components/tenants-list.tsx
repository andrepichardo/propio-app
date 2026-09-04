import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Mail, Phone, Plus, Users } from 'lucide-react';
import { tenantService } from '../services/tenant.service';
import type { TenantFilters } from '../validators/tenant.validators';
import { EmptyState } from '@/shared/components/empty-state';
import { Button } from '@/shared/components/ui/button';
import { PaginationControls } from '@/shared/components/pagination-controls';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { formatPhone, getInitials } from '@/shared/lib/format';

export async function TenantsList({
  ownerId,
  filters,
}: {
  ownerId: string;
  filters: TenantFilters;
}) {
  const { items, page, pageCount, total } = await tenantService.list(
    ownerId,
    filters,
  );
  const t = await getTranslations('tenants');

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={filters.search ? t('emptyFilteredTitle') : t('emptyTitle')}
        description={filters.search ? t('emptyFilteredDesc') : t('emptyDesc')}
        action={
          filters.search ? undefined : (
            <Button asChild>
              <Link href="/app/tenants/new">
                <Plus className="size-4" /> {t('add')}
              </Link>
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-card shadow-soft rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('colName')}</TableHead>
              <TableHead>{t('colContact')}</TableHead>
              <TableHead className="text-right">{t('colContracts')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((tenant) => (
              <TableRow key={tenant.id} className="relative cursor-pointer">
                <TableCell>
                  {/* Stretched link: the ::after overlay makes the whole row navigate. */}
                  <Link
                    href={`/app/tenants/${tenant.id}`}
                    className="flex items-center gap-3 after:absolute after:inset-0"
                  >
                    <Avatar>
                      {tenant.avatarUrl ? (
                        <AvatarImage src={tenant.avatarUrl} alt="" />
                      ) : null}
                      <AvatarFallback>
                        {getInitials(`${tenant.firstName} ${tenant.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {tenant.firstName} {tenant.lastName}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="text-muted-foreground space-y-0.5 text-xs">
                    {tenant.email ? (
                      <span className="flex items-center gap-1.5">
                        <Mail className="size-3.5" /> {tenant.email}
                      </span>
                    ) : null}
                    {tenant.phone ? (
                      <span className="flex items-center gap-1.5">
                        <Phone className="size-3.5" />{' '}
                        {formatPhone(tenant.phone)}
                      </span>
                    ) : null}
                    {!tenant.email && !tenant.phone ? '—' : null}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">{tenant._count.contracts}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationControls page={page} pageCount={pageCount} total={total} />
    </div>
  );
}

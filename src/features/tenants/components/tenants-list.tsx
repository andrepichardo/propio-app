import Link from 'next/link';
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
import { getInitials } from '@/shared/lib/format';

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

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={filters.search ? 'No tenants match your search' : 'No tenants yet'}
        description={
          filters.search
            ? 'Try a different name, email or phone number.'
            : 'Add tenants to link them to contracts and track their payments.'
        }
        action={
          filters.search ? undefined : (
            <Button asChild>
              <Link href="/app/tenants/new">
                <Plus className="size-4" /> Add tenant
              </Link>
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Contracts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((tenant) => (
              <TableRow key={tenant.id} className="cursor-pointer">
                <TableCell>
                  <Link
                    href={`/app/tenants/${tenant.id}`}
                    className="flex items-center gap-3"
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
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    {tenant.email ? (
                      <span className="flex items-center gap-1.5">
                        <Mail className="size-3.5" /> {tenant.email}
                      </span>
                    ) : null}
                    {tenant.phone ? (
                      <span className="flex items-center gap-1.5">
                        <Phone className="size-3.5" /> {tenant.phone}
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

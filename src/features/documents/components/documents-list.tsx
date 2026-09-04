import { getTranslations } from 'next-intl/server';
import { FolderClosed } from 'lucide-react';
import { documentService } from '../services/document.service';
import type { DocumentFilters } from '../validators/document.validators';
import { DOCUMENT_TYPE_ICONS, formatFileSize } from '../constants';
import { DeleteDocumentButton } from './delete-document-button';
import { EmptyState } from '@/shared/components/empty-state';
import { Badge } from '@/shared/components/ui/badge';
import { PaginationControls } from '@/shared/components/pagination-controls';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { getFormatDate } from '@/shared/lib/date-format.server';

export async function DocumentsList({
  ownerId,
  filters,
}: {
  ownerId: string;
  filters: DocumentFilters;
}) {
  const { items, page, pageCount, total } = await documentService.list(
    ownerId,
    filters,
  );
  const t = await getTranslations('documents');
  const formatDate = await getFormatDate();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={FolderClosed}
        title={t('emptyTitle')}
        description={t('emptyDesc')}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-card shadow-soft rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('colDocument')}</TableHead>
              <TableHead>{t('colType')}</TableHead>
              <TableHead>{t('colLinkedTo')}</TableHead>
              <TableHead>{t('colSize')}</TableHead>
              <TableHead>{t('colUploaded')}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((document) => {
              const Icon = DOCUMENT_TYPE_ICONS[document.type];
              return (
                <TableRow key={document.id}>
                  <TableCell>
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary flex items-center gap-2 font-medium"
                    >
                      <Icon className="text-muted-foreground size-4 shrink-0" />
                      <span className="truncate">{document.name}</span>
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t(`types.${document.type}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {document.property?.name ??
                      (document.tenant
                        ? `${document.tenant.firstName} ${document.tenant.lastName}`
                        : '—')}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatFileSize(document.sizeBytes)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(document.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DeleteDocumentButton documentId={document.id} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <PaginationControls page={page} pageCount={pageCount} total={total} />
    </div>
  );
}

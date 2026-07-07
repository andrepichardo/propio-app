import { FolderClosed } from 'lucide-react';
import { documentService } from '../services/document.service';
import type { DocumentFilters } from '../validators/document.validators';
import {
  DOCUMENT_TYPE_ICONS,
  DOCUMENT_TYPE_LABELS,
  formatFileSize,
} from '../constants';
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
import { formatDate } from '@/shared/lib/format';

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

  if (items.length === 0) {
    return (
      <EmptyState
        icon={FolderClosed}
        title="No documents yet"
        description="Upload contracts, invoices, IDs and photos to keep everything organised per property."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Linked to</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded</TableHead>
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
                      className="flex items-center gap-2 font-medium hover:text-primary"
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{document.name}</span>
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {DOCUMENT_TYPE_LABELS[document.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {document.property?.name ??
                      (document.tenant
                        ? `${document.tenant.firstName} ${document.tenant.lastName}`
                        : '—')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatFileSize(document.sizeBytes)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
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

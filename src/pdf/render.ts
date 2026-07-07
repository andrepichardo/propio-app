import 'server-only';
import { renderToBuffer } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import {
  ReceiptDocument,
  type ReceiptDocumentData,
} from './documents/receipt-document';
import {
  StatementDocument,
  type StatementDocumentData,
} from './documents/statement-document';

export type { ReceiptDocumentData } from './documents/receipt-document';
export type {
  StatementDocumentData,
  StatementLine,
} from './documents/statement-document';

/**
 * Render helpers returning a Node Buffer, ready to upload to storage or attach
 * to an email. React-PDF is server-only.
 */
export function renderReceiptPdf(
  data: ReceiptDocumentData,
): Promise<Buffer> {
  return renderToBuffer(
    ReceiptDocument({ data }) as ReactElement<DocumentProps>,
  );
}

export function renderStatementPdf(
  data: StatementDocumentData,
): Promise<Buffer> {
  return renderToBuffer(
    StatementDocument({ data }) as ReactElement<DocumentProps>,
  );
}

import { Document, Page, Text, View } from '@react-pdf/renderer';
import { pdfStyles as s } from '../styles';

export type ReceiptDocumentData = {
  number: string;
  issuedAt: string;
  concept: string;
  amount: string;
  balanceAfter: string;
  method: string;
  reference?: string;
  ownerName: string;
  tenantName: string;
  propertyName: string;
  appName: string;
  /** Pre-translated UI strings so the document stays locale-agnostic. */
  labels: {
    paymentReceipt: string;
    receipt: string;
    paid: string;
    receivedFrom: string;
    receivedBy: string;
    concept: string;
    amount: string;
    totalPaid: string;
    method: string;
    balance: string;
    reference: string;
    footer: string;
  };
};

/**
 * A polished payment receipt. Pure presentation — all values and labels are
 * pre-formatted strings so the document has no locale/formatting logic.
 */
export function ReceiptDocument({ data }: { data: ReceiptDocumentData }) {
  const { labels: l } = data;
  return (
    <Document
      title={`${l.receipt} ${data.number}`}
      author={data.ownerName}
      creator={data.appName}
    >
      <Page size="A4" style={s.page}>
        <View style={s.accentBar} fixed />

        <View style={s.header}>
          <View>
            <Text style={s.brand}>{data.appName}</Text>
            <Text style={s.mutedText}>{l.paymentReceipt}</Text>
          </View>
          <View style={s.docMeta}>
            <Text style={s.docTitle}>{l.receipt}</Text>
            <Text style={s.docNumber}>{data.number}</Text>
            <Text style={s.mutedText}>{data.issuedAt}</Text>
          </View>
        </View>

        <View style={s.paidBadge}>
          <Text>{l.paid}</Text>
        </View>

        <View style={[s.grid, { marginTop: 20 }]}>
          <View style={s.panel}>
            <Text style={s.label}>{l.receivedFrom}</Text>
            <Text style={s.value}>{data.tenantName}</Text>
            <Text style={s.mutedText}>{data.propertyName}</Text>
          </View>
          <View style={s.panel}>
            <Text style={s.label}>{l.receivedBy}</Text>
            <Text style={s.value}>{data.ownerName}</Text>
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <View style={s.tableHeader}>
            <Text style={[s.cellLabel, { width: '60%' }]}>{l.concept}</Text>
            <Text style={[s.cellLabel, { width: '40%', textAlign: 'right' }]}>
              {l.amount}
            </Text>
          </View>
          <View style={s.tableRow}>
            <Text style={{ width: '60%' }}>{data.concept}</Text>
            <Text style={{ width: '40%', textAlign: 'right' }}>
              {data.amount}
            </Text>
          </View>
        </View>

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>{l.totalPaid}</Text>
          <Text style={s.totalValue}>{data.amount}</Text>
        </View>

        <View style={[s.grid, { marginTop: 28 }]}>
          <View style={s.detailCol}>
            <Text style={s.label}>{l.method}</Text>
            <Text>{data.method}</Text>
          </View>
          <View style={s.detailCol}>
            <Text style={s.label}>{l.balance}</Text>
            <Text>{data.balanceAfter}</Text>
          </View>
          <View style={s.detailCol}>
            <Text style={s.label}>{l.reference}</Text>
            <Text>{data.reference || '—'}</Text>
          </View>
        </View>

        <Text style={s.footer} fixed>
          {l.footer}
        </Text>
      </Page>
    </Document>
  );
}

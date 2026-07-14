import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import { receiptStyles as r } from '../styles';

export type ReceiptDocumentData = {
  number: string;
  /** Short numeric date, e.g. `05/07/2026`. */
  dateShort: string;
  propertyName: string;
  propertyAddress?: string;
  ownerName: string;
  tenantName: string;
  method: string;
  concept: string;
  quantity: string;
  unitAmount: string;
  totalAmount: string;
  notes: string[];
  signatureUrl?: string;
  appName: string;
  /** Pre-translated UI strings so the document stays locale-agnostic. */
  labels: {
    title: string;
    date: string;
    tenant: string;
    method: string;
    receiptNo: string;
    description: string;
    quantity: string;
    unitPrice: string;
    totalPrice: string;
    notes: string;
    total: string;
    receivedBy: string;
  };
};

/**
 * Payment receipt mirroring the owner's classic paper format: navy accent
 * bar, property heading, pink date/total and a signature over "RECEIVED BY".
 * Pure presentation — every value and label arrives pre-formatted.
 */
export function ReceiptDocument({ data }: { data: ReceiptDocumentData }) {
  const { labels: l } = data;
  return (
    <Document
      title={`${l.title} ${data.number}`}
      author={data.ownerName}
      creator={data.appName}
    >
      <Page size="A4" style={r.page}>
        <View style={r.topBar} />

        <View style={r.propertyBlock}>
          <Text style={r.propertyName}>{data.propertyName}</Text>
          {data.propertyAddress ? (
            <Text style={r.propertyMeta}>{data.propertyAddress}</Text>
          ) : null}
          <Text style={r.propertyMeta}>{data.ownerName}</Text>
        </View>

        <Text style={r.title}>{l.title}</Text>
        <Text style={r.dateLine}>
          {l.date}: {data.dateShort}
        </Text>

        <View style={r.infoRow}>
          <View style={r.infoCol}>
            <Text style={r.infoLabel}>{l.tenant}</Text>
            <Text style={r.infoValue}>{data.tenantName}</Text>
          </View>
          <View style={r.infoCol}>
            <Text style={r.infoLabel}>{l.method}</Text>
            <Text style={r.infoValue}>{data.method}</Text>
          </View>
          <View style={r.infoCol}>
            <Text style={r.infoLabel}>{l.receiptNo}</Text>
            <Text style={r.infoValue}>{data.number}</Text>
          </View>
        </View>

        <View style={r.rule} />

        <View style={r.tableHeader}>
          <Text style={[r.th, { width: '46%', textAlign: 'left' }]}>
            {l.description}
          </Text>
          <Text style={[r.th, { width: '14%' }]}>{l.quantity}</Text>
          <Text style={[r.th, { width: '20%' }]}>{l.unitPrice}</Text>
          <Text style={[r.th, { width: '20%' }]}>{l.totalPrice}</Text>
        </View>
        <View style={r.tableRow}>
          <Text style={{ width: '46%' }}>{data.concept}</Text>
          <Text style={r.tdCenterMuted}>{data.quantity}</Text>
          <Text style={r.tdRightMuted}>{data.unitAmount}</Text>
          <Text style={r.tdRight}>{data.totalAmount}</Text>
        </View>

        <View style={r.rule} />

        <View style={r.bottomRow}>
          <View style={r.notesBlock}>
            <Text style={r.notesLabel}>{l.notes}:</Text>
            <View style={r.notesText}>
              {data.notes.map((note, index) => (
                <Text key={index} style={r.noteLine}>
                  {note}
                </Text>
              ))}
            </View>
          </View>
          <View style={r.totalsBlock}>
            <View style={r.totalLine}>
              <Text style={r.totalLabel}>{l.total}</Text>
              <Text style={r.totalSmall}>{data.totalAmount}</Text>
            </View>
            <Text style={r.totalBig}>{data.totalAmount}</Text>
          </View>
        </View>

        <View style={r.signatureBlock}>
          {data.signatureUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop
            <Image src={data.signatureUrl} style={r.signatureImage} />
          ) : null}
          <View style={r.signatureLine} />
          <Text style={r.signatureLabel}>{l.receivedBy}</Text>
        </View>
      </Page>
    </Document>
  );
}

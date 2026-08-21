import { Document, Page, Text, View } from '@react-pdf/renderer';
import { pdfStyles as s } from '../styles';

export type StatementLine = {
  date: string;
  concept: string;
  amount: string;
};

export type StatementDocumentData = {
  number: string;
  periodLabel: string;
  ownerName: string;
  tenantName: string;
  propertyName: string;
  lines: StatementLine[];
  totalCharged: string;
  totalPaid: string;
  outstanding: string;
  nextDueDate?: string;
  appName: string;
  /** Pre-translated copy in the owner's language. */
  labels: {
    title: string;
    subtitle: string;
    tenant: string;
    owner: string;
    date: string;
    concept: string;
    amount: string;
    noPayments: string;
    totalCharged: string;
    totalPaid: string;
    outstanding: string;
    nextDue: string;
    generatedBy: string;
  };
};

/** Monthly statement summarising charges, payments and outstanding balance. */
export function StatementDocument({ data }: { data: StatementDocumentData }) {
  const l = data.labels;
  return (
    <Document
      title={`${l.title} ${data.number}`}
      author={data.ownerName}
      creator={data.appName}
    >
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>{data.appName}</Text>
            <Text style={s.mutedText}>{l.subtitle}</Text>
          </View>
          <View style={s.docMeta}>
            <Text style={s.docTitle}>{l.title}</Text>
            <Text style={s.mutedText}>{data.number}</Text>
            <Text style={s.mutedText}>{data.periodLabel}</Text>
          </View>
        </View>

        <View style={s.grid}>
          <View style={s.col}>
            <Text style={s.label}>{l.tenant}</Text>
            <Text style={s.value}>{data.tenantName}</Text>
            <Text style={s.mutedText}>{data.propertyName}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.label}>{l.owner}</Text>
            <Text style={s.value}>{data.ownerName}</Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.tableHeader}>
          <Text style={[s.cellLabel, { width: '20%' }]}>{l.date}</Text>
          <Text style={[s.cellLabel, { width: '55%' }]}>{l.concept}</Text>
          <Text style={[s.cellLabel, { width: '25%', textAlign: 'right' }]}>
            {l.amount}
          </Text>
        </View>
        {data.lines.length === 0 ? (
          <View style={s.tableRow}>
            <Text style={s.mutedText}>{l.noPayments}</Text>
          </View>
        ) : (
          data.lines.map((line, index) => (
            <View style={s.tableRow} key={index}>
              <Text style={{ width: '20%' }}>{line.date}</Text>
              <Text style={{ width: '55%' }}>{line.concept}</Text>
              <Text style={{ width: '25%', textAlign: 'right' }}>
                {line.amount}
              </Text>
            </View>
          ))
        )}

        <View style={{ marginTop: 20, alignItems: 'flex-end' }}>
          <SummaryRow label={l.totalCharged} value={data.totalCharged} />
          <SummaryRow label={l.totalPaid} value={data.totalPaid} />
          <View style={[s.totalRow, { width: 240 }]}>
            <Text style={s.totalLabel}>{l.outstanding}</Text>
            <Text style={s.totalValue}>{data.outstanding}</Text>
          </View>
          {data.nextDueDate ? (
            <Text style={[s.mutedText, { marginTop: 8 }]}>{l.nextDue}</Text>
          ) : null}
        </View>

        <Text style={s.footer} fixed>
          {l.generatedBy}
        </Text>
      </Page>
    </Document>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 240,
        paddingVertical: 3,
      }}
    >
      <Text style={s.mutedText}>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}

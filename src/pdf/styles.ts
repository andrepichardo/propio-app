import { StyleSheet } from '@react-pdf/renderer';

/**
 * Shared PDF style tokens mirroring the app's neutral, premium aesthetic.
 * React-PDF uses its own flexbox/StyleSheet, so tokens are duplicated here
 * intentionally rather than importing Tailwind.
 */
export const colors = {
  ink: '#1f2430',
  muted: '#6b7280',
  border: '#e5e7eb',
  primary: '#4f46e5',
  subtle: '#f9fafb',
};

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 10,
    color: colors.ink,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  brand: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    lineHeight: 1.2,
    marginBottom: 3,
  },
  docMeta: { textAlign: 'right' },
  docTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.2,
    marginBottom: 4,
  },
  mutedText: { color: colors.muted },
  section: { marginBottom: 20 },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { width: '48%' },
  label: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.muted,
    marginBottom: 3,
  },
  value: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.subtle,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cellLabel: { fontSize: 8, color: colors.muted, textTransform: 'uppercase' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.ink,
  },
  totalLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    textAlign: 'center',
    fontSize: 8,
    color: colors.muted,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.subtle,
    color: colors.primary,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
});

/**
 * Receipt palette mirroring the owner's classic paper format: navy accents,
 * indigo property heading and magenta highlights for date and grand total.
 */
export const receiptColors = {
  navy: '#2d3193',
  indigo: '#6a6fdb',
  pink: '#ec138f',
  ink: '#1f2430',
  muted: '#6b7280',
  border: '#e5e7eb',
  subtle: '#f3f4f6',
};

export const receiptStyles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 56,
    fontSize: 10,
    color: receiptColors.ink,
    fontFamily: 'Helvetica',
    lineHeight: 1.45,
  },
  topBar: {
    height: 9,
    backgroundColor: receiptColors.navy,
    marginBottom: 26,
  },
  propertyBlock: { marginBottom: 26 },
  propertyName: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: receiptColors.indigo,
    marginBottom: 4,
  },
  propertyMeta: { color: receiptColors.muted, fontSize: 9.5 },
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: receiptColors.navy,
    lineHeight: 1.15,
    marginBottom: 6,
  },
  dateLine: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: receiptColors.pink,
    lineHeight: 1.2,
    marginBottom: 22,
  },
  infoRow: { flexDirection: 'row', marginBottom: 22 },
  infoCol: { width: '33%' },
  infoLabel: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  infoValue: { fontSize: 10 },
  rule: {
    borderBottomWidth: 1,
    borderBottomColor: receiptColors.border,
    marginVertical: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    marginTop: 6,
  },
  th: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: receiptColors.navy,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: receiptColors.subtle,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  tdCenterMuted: {
    width: '14%',
    textAlign: 'right',
    color: receiptColors.muted,
  },
  tdRightMuted: {
    width: '20%',
    textAlign: 'right',
    color: receiptColors.muted,
  },
  tdRight: { width: '20%', textAlign: 'right' },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  notesBlock: { flexDirection: 'row', width: '58%' },
  notesLabel: { color: receiptColors.muted, marginRight: 10 },
  notesText: { flex: 1 },
  noteLine: { color: receiptColors.muted, marginBottom: 8 },
  totalsBlock: { width: '38%', alignItems: 'flex-end' },
  totalLine: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  totalLabel: {
    fontSize: 10.5,
    color: receiptColors.navy,
    letterSpacing: 0.5,
  },
  totalSmall: { fontSize: 10.5, fontFamily: 'Helvetica-Bold' },
  totalBig: {
    marginTop: 22,
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: receiptColors.pink,
  },
  signatureBlock: {
    marginTop: 44,
    marginLeft: 64,
    width: 220,
    alignItems: 'center',
  },
  signatureImage: {
    height: 54,
    objectFit: 'contain',
    marginBottom: -8,
  },
  signatureLine: {
    alignSelf: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: receiptColors.ink,
  },
  signatureLabel: {
    marginTop: 4,
    fontSize: 9,
    color: receiptColors.muted,
    letterSpacing: 1,
  },
});

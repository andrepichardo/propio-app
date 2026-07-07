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
  },
  docMeta: { textAlign: 'right' },
  docTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
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

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LegalDocument } from '@/features/marketing/components/legal-document';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('refunds') };
}

export default function RefundsPage() {
  return <LegalDocument namespace="legal.refunds" />;
}

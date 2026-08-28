import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LegalDocument } from '@/features/marketing/components/legal-document';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('terms') };
}

export default function TermsPage() {
  return <LegalDocument namespace="legal.terms" />;
}

import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/shared/lib/auth/session';
import { SiteHeader } from '@/features/marketing/components/site-header';
import { SiteFooter } from '@/features/marketing/components/site-footer';
import { Hero } from '@/features/marketing/components/hero';
import { CapabilityStrip } from '@/features/marketing/components/capability-strip';
import { BeforeAfter } from '@/features/marketing/components/before-after';
import { FeatureBento } from '@/features/marketing/components/feature-bento';
import { HowItWorks } from '@/features/marketing/components/how-it-works';
import { Showcase } from '@/features/marketing/components/showcase';
import { UseCases } from '@/features/marketing/components/use-cases';
import { Faq } from '@/features/marketing/components/faq';
import { FinalCta } from '@/features/marketing/components/final-cta';
import { LandingJsonLd } from '@/features/marketing/components/json-ld';

/**
 * Public landing page.
 *
 * Stays a server component: it resolves the session once (so every CTA points
 * at `/app` for a signed-in visitor) and renders the marketing sections, each
 * of which opts into client JS only where it animates.
 */
export default async function LandingPage() {
  const user = await getCurrentUser();
  const t = await getTranslations('landing');
  const authed = Boolean(user);

  return (
    <div className="flex min-h-screen flex-col">
      <LandingJsonLd />
      <SiteHeader authed={authed} />

      {/* Skip link — the page is long and anchor-heavy. */}
      <a
        href="#features"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        {t('skipToContent')}
      </a>

      <main className="flex-1">
        <Hero authed={authed} />
        <CapabilityStrip />
        <BeforeAfter />
        <FeatureBento />
        <HowItWorks />
        <Showcase />
        <UseCases />
        <Faq />
        <FinalCta authed={authed} />
      </main>

      <SiteFooter />
    </div>
  );
}

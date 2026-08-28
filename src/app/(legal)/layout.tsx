import { getCurrentUser } from '@/shared/lib/auth/session';
import { SiteHeader } from '@/features/marketing/components/site-header';
import { SiteFooter } from '@/features/marketing/components/site-footer';

export default async function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div data-smooth-scroll className="flex min-h-screen flex-col">
      <SiteHeader authed={Boolean(user)} onLanding={false} />
      <main className="flex-1">{children}</main>
      <SiteFooter authed={Boolean(user)} />
    </div>
  );
}

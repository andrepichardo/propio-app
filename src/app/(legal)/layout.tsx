import { getCurrentUser } from '@/shared/lib/auth/session';
import { SiteHeader } from '@/features/marketing/components/site-header';
import { SiteFooter } from '@/features/marketing/components/site-footer';

/**
 * Shell for the public legal pages. Same header/footer as the landing, minus
 * the in-page section anchors (they point at sections that only exist on `/`).
 */
export default async function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div data-smooth-scroll className="flex min-h-screen flex-col">
      <SiteHeader authed={Boolean(user)} showNav={false} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

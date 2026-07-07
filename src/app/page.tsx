import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  FileText,
  Receipt,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { Logo } from '@/shared/components/brand/logo';
import { Button } from '@/shared/components/ui/button';
import { getCurrentUser } from '@/shared/lib/auth/session';

const features = [
  {
    icon: Wallet,
    title: 'Payments that reconcile themselves',
    description:
      'Register a payment once — Propio marks rent as paid, updates balances, and files the receipt automatically.',
  },
  {
    icon: Receipt,
    title: 'Beautiful receipts & statements',
    description:
      'Generate polished PDF receipts and monthly statements your tenants will actually appreciate.',
  },
  {
    icon: BarChart3,
    title: 'Reports you understand at a glance',
    description:
      'Revenue, expenses, profit, and occupancy — visualised across every property you own.',
  },
  {
    icon: FileText,
    title: 'Every document, one place',
    description:
      'Contracts, IDs, invoices and photos, organised per property and always a click away.',
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-2">
            {user ? (
              <Button asChild>
                <Link href="/app">
                  Go to dashboard <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container flex flex-col items-center py-24 text-center">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            Built for independent landlords
          </span>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Manage your properties with confidence
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Propio is the all-in-one operating system for landlords with 1 to 50
            properties. Rentals, tenants, contracts, payments and reports — one
            calm, fast dashboard.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href={user ? '/app' : '/register'}>
                Start managing free <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="container pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="animate-fade-in-up rounded-xl border bg-card p-6 shadow-soft"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Propio. Manage your properties with
            confidence.
          </p>
        </div>
      </footer>
    </div>
  );
}

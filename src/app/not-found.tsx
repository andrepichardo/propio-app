import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import { Logo } from '@/shared/components/brand/logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div className="space-y-1">
        <p className="text-5xl font-semibold tracking-tight">404</p>
        <h1 className="text-lg font-medium">Page not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist or may have been moved.
        </p>
      </div>
      <Button asChild>
        <Link href="/app">Back to dashboard</Link>
      </Button>
    </div>
  );
}

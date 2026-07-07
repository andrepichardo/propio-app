import type { Metadata } from 'next';
import Link from 'next/link';
import { Separator } from '@/shared/components/ui/separator';
import { LoginForm } from '@/features/auth/components/login-form';
import { OAuthButtons } from '@/features/auth/components/oauth-buttons';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue to your dashboard
        </p>
      </div>

      <OAuthButtons />

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
          or continue with email
        </span>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        Don’t have an account?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

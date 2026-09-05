'use client';

import * as React from 'react';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import { Toaster } from '@/shared/components/ui/sonner';

/**
 * Global client-side providers: theme, tooltips and toasts. Mounted once in the
 * root layout.
 *
 * There is deliberately NO React Query here. It was mounted for a year without
 * a single `useQuery`/`useMutation` anywhere — this app reads through server
 * components and writes through server actions, so a client cache has nothing
 * to cache. Since the provider is a client component, keeping it shipped the
 * whole library to every visitor's browser for nothing.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      <Toaster />
    </ThemeProvider>
  );
}

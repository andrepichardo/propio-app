'use client';

import { useTranslations } from 'next-intl';
import {
  BellRing,
  Coins,
  FileSignature,
  FileStack,
  Languages,
  Lock,
  PieChart,
  Receipt,
  Smartphone,
} from 'lucide-react';
import { Marquee } from './motion-primitives';

/**
 * Capability ticker under the hero.
 *
 * A conventional landing puts customer logos here. Propio has none to show
 * yet, and inventing them would be a lie — so the strip advertises what the
 * product actually does instead. It reads as social proof's honest cousin.
 */
const CAPABILITIES = [
  { icon: Receipt, key: 'receipts' },
  { icon: Coins, key: 'multiCurrency' },
  { icon: BellRing, key: 'reminders' },
  { icon: PieChart, key: 'reports' },
  { icon: FileStack, key: 'documents' },
  { icon: FileSignature, key: 'signature' },
  { icon: Languages, key: 'bilingual' },
  { icon: Smartphone, key: 'mobile' },
  { icon: Lock, key: 'privacy' },
] as const;

export function CapabilityStrip() {
  const t = useTranslations('landing.capabilities');

  return (
    <section className="bg-muted/30 relative border-y py-5">
      <p className="sr-only">{t('srTitle')}</p>
      <Marquee duration={55}>
        {CAPABILITIES.map((capability) => (
          <span
            key={capability.key}
            className="bg-background/70 text-muted-foreground mx-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap shadow-xs"
          >
            <capability.icon className="text-primary size-4 shrink-0" />
            {t(capability.key)}
          </span>
        ))}
      </Marquee>
    </section>
  );
}

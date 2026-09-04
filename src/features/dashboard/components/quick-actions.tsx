import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Building2,
  FileSignature,
  UserPlus,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/shared/components/ui/card';

const actions: { labelKey: string; href: string; icon: LucideIcon }[] = [
  { labelKey: 'addProperty', href: '/app/properties/new', icon: Building2 },
  { labelKey: 'addTenant', href: '/app/tenants/new', icon: UserPlus },
  { labelKey: 'newContract', href: '/app/contracts/new', icon: FileSignature },
  { labelKey: 'registerPayment', href: '/app/payments/new', icon: Wallet },
];

export function QuickActions() {
  const t = useTranslations('dashboard');
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {actions.map((action) => (
        <Link key={action.href} href={action.href} className="h-full">
          <Card className="hover:border-primary/30 hover:shadow-card flex h-full flex-col items-center gap-2 p-4 text-center transition-all hover:-translate-y-0.5">
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <action.icon className="size-5" />
            </span>
            {/* min-h-[2lh] reserves two lines so cards match even when a label wraps. */}
            <span className="flex min-h-[2lh] items-center justify-center text-sm font-medium">
              {t(action.labelKey)}
            </span>
          </Card>
        </Link>
      ))}
    </div>
  );
}

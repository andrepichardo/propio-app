import Link from 'next/link';
import {
  Building2,
  FileSignature,
  UserPlus,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/shared/components/ui/card';

const actions: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Add property', href: '/app/properties/new', icon: Building2 },
  { label: 'Add tenant', href: '/app/tenants/new', icon: UserPlus },
  { label: 'New contract', href: '/app/contracts/new', icon: FileSignature },
  { label: 'Register payment', href: '/app/payments/new', icon: Wallet },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((action) => (
        <Link key={action.href} href={action.href}>
          <Card className="flex flex-col items-center gap-2 p-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <action.icon className="size-5" />
            </span>
            <span className="text-sm font-medium">{action.label}</span>
          </Card>
        </Link>
      ))}
    </div>
  );
}

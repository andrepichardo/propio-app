import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileSignature,
  Wallet,
  Receipt,
  ScrollText,
  FileBarChart,
  FolderClosed,
  Banknote,
  Bell,
} from 'lucide-react';

/** `labelKey`/`titleKey` index into the `nav` message namespace. */
export type NavItem = {
  labelKey: string;
  href: string;
  icon: LucideIcon;
};

export type NavSection = {
  titleKey?: string;
  items: NavItem[];
};

/** Single source of truth for the sidebar and command palette. */
export const navSections: NavSection[] = [
  {
    items: [{ labelKey: 'dashboard', href: '/app', icon: LayoutDashboard }],
  },
  {
    titleKey: 'manage',
    items: [
      { labelKey: 'properties', href: '/app/properties', icon: Building2 },
      { labelKey: 'tenants', href: '/app/tenants', icon: Users },
      { labelKey: 'contracts', href: '/app/contracts', icon: FileSignature },
    ],
  },
  {
    titleKey: 'money',
    items: [
      { labelKey: 'payments', href: '/app/payments', icon: Wallet },
      { labelKey: 'receipts', href: '/app/receipts', icon: Receipt },
      { labelKey: 'statements', href: '/app/statements', icon: ScrollText },
      { labelKey: 'expenses', href: '/app/expenses', icon: Banknote },
    ],
  },
  {
    titleKey: 'insights',
    items: [
      { labelKey: 'reports', href: '/app/reports', icon: FileBarChart },
      { labelKey: 'documents', href: '/app/documents', icon: FolderClosed },
      { labelKey: 'notifications', href: '/app/notifications', icon: Bell },
    ],
  },
];

export const allNavItems: NavItem[] = navSections.flatMap(
  (section) => section.items,
);

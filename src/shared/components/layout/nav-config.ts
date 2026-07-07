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

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

/** Single source of truth for the sidebar and command palette. */
export const navSections: NavSection[] = [
  {
    items: [{ label: 'Dashboard', href: '/app', icon: LayoutDashboard }],
  },
  {
    title: 'Manage',
    items: [
      { label: 'Properties', href: '/app/properties', icon: Building2 },
      { label: 'Tenants', href: '/app/tenants', icon: Users },
      { label: 'Contracts', href: '/app/contracts', icon: FileSignature },
    ],
  },
  {
    title: 'Money',
    items: [
      { label: 'Payments', href: '/app/payments', icon: Wallet },
      { label: 'Receipts', href: '/app/receipts', icon: Receipt },
      { label: 'Statements', href: '/app/statements', icon: ScrollText },
      { label: 'Expenses', href: '/app/expenses', icon: Banknote },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Reports', href: '/app/reports', icon: FileBarChart },
      { label: 'Documents', href: '/app/documents', icon: FolderClosed },
      { label: 'Notifications', href: '/app/notifications', icon: Bell },
    ],
  },
];

export const allNavItems: NavItem[] = navSections.flatMap(
  (section) => section.items,
);

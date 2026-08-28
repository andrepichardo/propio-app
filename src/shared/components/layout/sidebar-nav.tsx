'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { navSections } from './nav-config';

function isActive(pathname: string, href: string): boolean {
  if (href === '/app') return pathname === '/app';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {navSections.map((section, index) => (
        <div key={section.titleKey ?? index} className="space-y-1">
          {section.titleKey ? (
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              {t(section.titleKey)}
            </p>
          ) : null}
          {section.items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <item.icon className="size-[18px] shrink-0" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

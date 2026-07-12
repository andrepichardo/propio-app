import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Bell, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { MobileNav } from './mobile-nav';
import { UserMenu } from './user-menu';
import type { SessionUser } from '@/shared/lib/auth/session';

interface TopbarProps {
  user: SessionUser;
  unreadCount?: number;
}

export function Topbar({ user, unreadCount = 0 }: TopbarProps) {
  const t = useTranslations('topbar');
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <MobileNav />

      <div className="ml-auto flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/app/payments/new">
                <Plus className="size-4" />
                <span className="hidden sm:inline">
                  {t('registerPayment')}
                </span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('recordPayment')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative"
            >
              <Link href="/app/notifications">
                <Bell className="size-5" />
                {unreadCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 flex size-2 items-center justify-center rounded-full bg-destructive" />
                ) : null}
                <span className="sr-only">{t('notifications')}</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('notifications')}</TooltipContent>
        </Tooltip>

        <div className="ml-1">
          <UserMenu name={user.name} email={user.email} image={user.image} />
        </div>
      </div>
    </header>
  );
}

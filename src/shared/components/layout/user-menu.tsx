'use client';

import { useTransition } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { LogOut, Settings, SunMoon, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { LanguageMenuSub } from '@/shared/components/language/language-switcher';
import { getInitials } from '@/shared/lib/format';
import { signOutAction } from '@/features/auth/actions/auth.actions';

type UserMenuProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function UserMenu({ name, email, image }: UserMenuProps) {
  const t = useTranslations('userMenu');
  const [isPending, startTransition] = useTransition();
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar>
            {image ? <AvatarImage src={image} alt={name ?? 'User'} /> : null}
            <AvatarFallback>{getInitials(name ?? email)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {name ?? t('account')}
            </span>
            {email ? (
              <span className="truncate text-xs text-muted-foreground">
                {email}
              </span>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/settings/profile">
            <UserIcon /> {t('profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app/settings">
            <Settings /> {t('settings')}
          </Link>
        </DropdownMenuItem>

        <LanguageMenuSub />

        {/* `theme` is undefined until next-themes hydrates, but the menu only
            renders once opened (client-side), so there's no SSR mismatch. */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunMoon /> {t('theme')}
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="light">
                  {t('themeLight')}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  {t('themeDark')}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  {t('themeSystem')}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault();
            startTransition(() => {
              void signOutAction();
            });
          }}
        >
          <LogOut /> {t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

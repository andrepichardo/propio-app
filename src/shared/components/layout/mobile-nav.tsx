'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Logo } from '@/shared/components/brand/logo';
import { SidebarNav } from './sidebar-nav';

export function MobileNav() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="size-5" />
          <span className="sr-only">{t('openMenu')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="top-0 left-0 flex h-full max-w-68 translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-r p-0 sm:rounded-none">
        <DialogTitle className="sr-only">{t('menuTitle')}</DialogTitle>
        <div className="flex h-16 shrink-0 items-center border-b px-5">
          <Logo />
        </div>
        <div
          className="flex-1 scrollbar-thin overflow-y-auto"
          onClickCapture={(event) => {
            if ((event.target as Element).closest('a')) setOpen(false);
          }}
        >
          <SidebarNav />
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
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

/** Slide-over navigation for small screens (reuses SidebarNav). */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="left-0 top-0 h-full max-w-[17rem] translate-x-0 translate-y-0 rounded-none border-r p-0 sm:rounded-none">
        <DialogTitle className="sr-only">Navigation</DialogTitle>
        <div className="flex h-16 items-center border-b px-5">
          <Logo />
        </div>
        <div className="overflow-y-auto scrollbar-thin">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

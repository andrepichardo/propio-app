'use client';

import { useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Camera, Loader2 } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { uploadTenantAvatarAction } from '../actions/tenant-avatar.action';

export function TenantAvatarUpload({
  tenantId,
  avatarUrl,
  initials,
}: {
  tenantId: string;
  avatarUrl?: string | null;
  initials: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function onFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const formData = new FormData();
    formData.set('tenantId', tenantId);
    formData.set('file', file);

    startTransition(async () => {
      const result = await uploadTenantAvatarAction(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Avatar updated.');
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <Avatar className="size-16">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        aria-label="Change avatar"
        className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border bg-background shadow-soft transition-colors hover:text-primary"
      >
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Camera className="size-3.5" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFileChosen}
      />
    </div>
  );
}

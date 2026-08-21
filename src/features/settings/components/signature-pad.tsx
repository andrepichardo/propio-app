'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Eraser, PenLine } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';

const STROKE = '#111827';
const LINE_WIDTH = 2.5;

/**
 * Draw-your-signature pad. Captures mouse/touch strokes on a transparent
 * canvas, crops to the drawn area, and hands back a transparent PNG `File`
 * (uploaded through the same action as "Subir firma").
 *
 * The backing store is sized to the *displayed* CSS pixels (× dpr) lazily, on
 * the first stroke — by then the dialog is open and laid out, so coordinates
 * map 1:1 to CSS px and never drift (the classic "offset on first open" bug).
 */
export function SignaturePad({ onSave }: { onSave: (file: File) => void }) {
  const t = useTranslations('settings');
  const [open, setOpen] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sized = useRef(false);
  const cssSize = useRef({ w: 0, h: 0 });
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const bounds = useRef({
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  });

  function resetBounds() {
    bounds.current = {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    };
  }

  /** Size the backing store to the current displayed size (× dpr) and prep the
   * stroke style. Returns false if the canvas isn't laid out yet. */
  function sizeCanvas(): boolean {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1) return false;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = STROKE;
    ctx.clearRect(0, 0, rect.width, rect.height);
    cssSize.current = { w: rect.width, h: rect.height };
    return true;
  }

  /**
   * Fresh session on open. This runs in the event handler rather than an
   * effect on `open`: resetting state from an effect triggers a second,
   * cascading render (and trips `react-hooks/set-state-in-effect`).
   *
   * No canvas clearing needed here — the dialog content is unmounted while
   * closed, so each open gets a brand-new canvas, and `sizeCanvas()` clears it
   * again on the first stroke once `sized` is back to false.
   */
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    sized.current = false;
    setHasInk(false);
    resetBounds();
  }

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function track(p: { x: number; y: number }) {
    const b = bounds.current;
    b.minX = Math.min(b.minX, p.x);
    b.minY = Math.min(b.minY, p.y);
    b.maxX = Math.max(b.maxX, p.x);
    b.maxY = Math.max(b.maxY, p.y);
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!sized.current) {
      if (!sizeCanvas()) return;
      sized.current = true;
    }
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawing.current = true;
    const p = point(e);
    last.current = p;
    ctx.beginPath(); // dot so a tap registers
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    track(p);
    setHasInk(true);
    canvasRef.current?.setPointerCapture(e.pointerId);
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    track(p);
  }

  function onUp() {
    drawing.current = false;
    last.current = null;
  }

  function clearPad() {
    sized.current = sizeCanvas();
    setHasInk(false);
    resetBounds();
  }

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = cssSize.current;
    const pad = 14;
    const b = bounds.current;
    const minX = Math.max(0, b.minX - pad);
    const minY = Math.max(0, b.minY - pad);
    const maxX = Math.min(w, b.maxX + pad);
    const maxY = Math.min(h, b.maxY + pad);
    const sx = minX * dpr;
    const sy = minY * dpr;
    const sw = (maxX - minX) * dpr;
    const sh = (maxY - minY) * dpr;

    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(sw));
    out.height = Math.max(1, Math.round(sh));
    out
      .getContext('2d')!
      .drawImage(canvas, sx, sy, sw, sh, 0, 0, out.width, out.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      out.toBlob(resolve, 'image/png'),
    );
    if (!blob) return;
    onSave(new File([blob], 'signature.png', { type: 'image/png' }));
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <PenLine className="size-4" /> {t('drawSignature')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('drawSignatureTitle')}</DialogTitle>
          <DialogDescription>{t('drawSignatureHint')}</DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-lg border bg-white">
          <canvas
            ref={canvasRef}
            style={{ touchAction: 'none' }}
            className="block aspect-[600/220] w-full cursor-crosshair"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
        </div>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="ghost" onClick={clearPad}>
            <Eraser className="size-4" /> {t('clear')}
          </Button>
          <Button type="button" onClick={save} disabled={!hasInk}>
            {t('useSignature')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

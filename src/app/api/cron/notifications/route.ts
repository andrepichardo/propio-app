import { type NextRequest, NextResponse } from 'next/server';
import { env } from '@/shared/config/env';
import { runNotificationScheduler } from '@/features/notifications/services/notification-scheduler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Daily reminder job. Trigger via Vercel Cron (see vercel.json) or any
 * external scheduler:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/notifications
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured.' },
      { status: 503 },
    );
  }

  const authorization = request.headers.get('authorization');
  if (authorization !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runNotificationScheduler();
  return NextResponse.json({ ok: true, ...result });
}

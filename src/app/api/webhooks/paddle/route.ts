import { type NextRequest, NextResponse } from 'next/server';
import { type EventEntity, EventName, Webhooks } from '@paddle/paddle-node-sdk';
import { env } from '@/shared/config/env';
import { getPaddle } from '@/features/billing/lib/paddle';
import { billingService } from '@/features/billing/services/billing.service';

export const dynamic = 'force-dynamic';

/**
 * Paddle notification destination. Point it at
 * `https://<host>/api/webhooks/paddle` and subscribe it to the `subscription.*`
 * events; everything else is acknowledged and ignored.
 *
 * Status codes are what Paddle retries on: 2xx settles the delivery, anything
 * else is retried with backoff for days. So a bad signature is 401 (never
 * ours), and a failure to apply a genuine event is 500 — retrying is exactly
 * what should happen.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const paddle = getPaddle();
  if (!paddle || !env.PADDLE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Billing is not configured.' },
      { status: 503 },
    );
  }

  const signature = request.headers.get('paddle-signature');
  // The signature covers the exact bytes Paddle sent: read the raw text,
  // never a re-serialised JSON body.
  const body = await request.text();
  if (!signature || !body) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
  }

  let valid = false;
  try {
    valid = await paddle.webhooks.isSignatureValid(
      body,
      env.PADDLE_WEBHOOK_SECRET,
      signature,
    );
  } catch {
    // A malformed header throws rather than returning false.
  }
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  // Parsed only once the signature holds, and separately from it: the SDK's
  // `unmarshal` reports a payload it cannot model as a bad signature, which
  // would hide a genuine subscription event behind a 401.
  const payload = JSON.parse(body) as { event_type?: string };
  let event: EventEntity;
  try {
    event = Webhooks.fromJson(
      payload as Parameters<typeof Webhooks.fromJson>[0],
    );
  } catch (error) {
    if (payload.event_type?.startsWith('subscription.')) {
      console.error('[billing] unparseable subscription event', error);
      return NextResponse.json(
        { error: 'Unparseable event.' },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, ignored: payload.event_type });
  }

  let subscription;
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionUpdated:
    case EventName.SubscriptionActivated:
    case EventName.SubscriptionTrialing:
    case EventName.SubscriptionPastDue:
    case EventName.SubscriptionPaused:
    case EventName.SubscriptionResumed:
    case EventName.SubscriptionCanceled:
      subscription = event.data;
      break;
    default:
      return NextResponse.json({ ok: true, ignored: event.eventType });
  }

  try {
    const outcome = await billingService.applyPaddleSubscription(subscription);
    return NextResponse.json({ ok: true, outcome });
  } catch (error) {
    console.error(
      '[billing] webhook failed',
      event.eventType,
      event.eventId,
      error,
    );
    return NextResponse.json(
      { error: 'Could not apply event.' },
      { status: 500 },
    );
  }
}

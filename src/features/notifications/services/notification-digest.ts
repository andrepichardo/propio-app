import 'server-only';
import { subDays } from 'date-fns';
import { getTranslations } from 'next-intl/server';
import { NotificationType } from '@/generated/prisma/enums';
import { prisma } from '@/shared/lib/prisma';
import { defaultLocale, isLocale, type Locale } from '@/i18n/config';
import { sendReminderDigestEmails, type ReminderDigest } from '@/emails/send';

/**
 * Only the reminders the daily job produces. A PAYMENT_PARTIAL notice is
 * created by the owner's own action seconds earlier and they already saw it —
 * mailing it back the next morning is noise, not a reminder.
 */
const REMINDER_TYPES = [
  NotificationType.PAYMENT_UPCOMING,
  NotificationType.PAYMENT_LATE,
  NotificationType.CONTRACT_EXPIRING,
] as const;

/**
 * How far back an unsent notification is still worth mailing. If delivery was
 * broken for a week we send the last few days, not a fifty-line backlog of
 * reminders the owner can no longer act on.
 */
const MAX_AGE_DAYS = 3;

type NotificationMeta = {
  key?: string;
  params?: Record<string, string | number>;
};

/** Narrow Prisma's `JsonValue` without trusting it. */
function readMeta(value: unknown): NotificationMeta | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  const key = typeof record.key === 'string' ? record.key : undefined;
  const params =
    typeof record.params === 'object' && record.params !== null
      ? (record.params as Record<string, string | number>)
      : undefined;
  return { key, params };
}

/**
 * Mail each owner ONE digest of the reminders they have not been sent yet.
 *
 * Runs at the end of the daily scheduler. Three things make it safe to re-run:
 *   • it only picks rows with `emailedAt: null`, so nothing is sent twice;
 *   • it stamps ONLY the owners whose batch the provider accepted, so a failed
 *     send is retried tomorrow instead of being lost — the scheduler's own
 *     de-dupe works off the notification row and would never recreate it;
 *   • owners who turned `notifyByEmail` off are filtered in the query, so their
 *     rows stay unstamped and never leak out if they turn it back on… which is
 *     deliberate: `MAX_AGE_DAYS` ages them out instead.
 *
 * Returns how many digests actually went out.
 */
export async function sendReminderDigests(now: Date): Promise<number> {
  const pending = await prisma.notification.findMany({
    where: {
      emailedAt: null,
      type: { in: [...REMINDER_TYPES] },
      createdAt: { gte: subDays(now, MAX_AGE_DAYS) },
      owner: { notifyByEmail: true, email: { not: '' } },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      body: true,
      metadata: true,
      ownerId: true,
      owner: { select: { name: true, email: true, locale: true } },
    },
  });
  if (pending.length === 0) return 0;

  // The job runs outside a request, so the locale never comes from the cookie —
  // each owner's own `locale` has to be passed explicitly. Only two catalogues
  // exist, so resolve each once instead of per notification.
  const translators = new Map<
    Locale,
    Awaited<ReturnType<typeof getTranslations<'notifications'>>>
  >();
  async function translatorFor(locale: Locale) {
    const cached = translators.get(locale);
    if (cached) return cached;
    const t = await getTranslations({ locale, namespace: 'notifications' });
    translators.set(locale, t);
    return t;
  }

  const byOwner = new Map<
    string,
    { digest: ReminderDigest; notificationIds: string[] }
  >();

  for (const notification of pending) {
    const short = notification.owner.locale.slice(0, 2);
    const locale = isLocale(short) ? short : defaultLocale;
    const t = await translatorFor(locale);

    // Prefer the stored key + params; fall back to the English text captured on
    // the row, exactly like the in-app panel does for legacy notifications.
    const meta = readMeta(notification.metadata);
    const item =
      meta?.key && t.has(`${meta.key}.title`)
        ? {
            heading: t(`${meta.key}.title`, meta.params),
            body: t(`${meta.key}.body`, meta.params),
          }
        : { heading: notification.title, body: notification.body ?? '' };

    const existing = byOwner.get(notification.ownerId);
    if (existing) {
      existing.digest.items.push(item);
      existing.notificationIds.push(notification.id);
      continue;
    }
    byOwner.set(notification.ownerId, {
      digest: {
        ref: notification.ownerId,
        to: notification.owner.email,
        name: notification.owner.name,
        items: [item],
        locale,
      },
      notificationIds: [notification.id],
    });
  }

  const entries = [...byOwner.values()];
  const sentRefs = await sendReminderDigestEmails(
    entries.map((entry) => entry.digest),
  );
  if (sentRefs.length === 0) return 0;

  const accepted = new Set(sentRefs);
  const stampIds = entries
    .filter((entry) => accepted.has(entry.digest.ref))
    .flatMap((entry) => entry.notificationIds);

  await prisma.notification.updateMany({
    where: { id: { in: stampIds } },
    data: { emailedAt: now },
  });

  return sentRefs.length;
}

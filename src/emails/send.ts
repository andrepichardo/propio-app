import 'server-only';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/config';
import { clientEnv } from '@/shared/config/env';
import { EMAIL_FROM, getResend } from './client';
import {
  receiptEmail,
  reminderDigestEmail,
  resetPasswordEmail,
  verifyEmail,
  welcomeEmail,
} from './templates';

type Attachment = { filename: string; content: Buffer };

const APP = clientEnv.NEXT_PUBLIC_APP_NAME;
const APP_URL = clientEnv.NEXT_PUBLIC_APP_URL;

/**
 * Email copy follows the request locale (the acting user's language). Callers
 * running inside `after()` are outside the request scope, so the cookie
 * fallback doesn't apply there — they must pass the locale explicitly.
 */
function emailTranslations(locale?: Locale) {
  return locale
    ? getTranslations({ locale, namespace: 'emails' })
    : getTranslations('emails');
}

async function deliver(params: {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    // No API key configured — log so local dev still shows what would send.
    console.warn(
      `[email] RESEND_API_KEY not set. Would send "${params.subject}" to ${params.to}.`,
    );
    return;
  }
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
    attachments: params.attachments,
  });
  if (error) {
    console.error('[email] failed to send', error);
  }
}

export async function sendWelcomeEmail(params: {
  to: string;
  name?: string | null;
  locale?: Locale;
}): Promise<void> {
  const t = await emailTranslations(params.locale);
  const { subject, html } = welcomeEmail({
    subject: t('welcomeSubject', { app: APP }),
    title: params.name
      ? t('welcomeTitleNamed', { name: params.name })
      : t('welcomeTitle'),
    body: t('welcomeBody', { app: APP }),
    cta: t('welcomeCta'),
    footer: t('footer'),
    dashboardUrl: `${APP_URL}/app`,
  });
  await deliver({ to: params.to, subject, html });
}

export async function sendResetPasswordEmail(params: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  const t = await emailTranslations();
  const { subject, html } = resetPasswordEmail({
    subject: t('resetSubject', { app: APP }),
    title: t('resetTitle'),
    body: t('resetBody'),
    cta: t('resetCta'),
    footer: t('footer'),
    resetUrl: params.resetUrl,
  });
  await deliver({ to: params.to, subject, html });
}

export async function sendVerifyEmail(params: {
  to: string;
  verifyUrl: string;
  locale?: Locale;
}): Promise<void> {
  const t = await emailTranslations(params.locale);
  const { subject, html } = verifyEmail({
    subject: t('verifySubject', { app: APP }),
    title: t('verifyTitle'),
    body: t('verifyBody'),
    cta: t('verifyCta'),
    footer: t('footer'),
    verifyUrl: params.verifyUrl,
  });
  await deliver({ to: params.to, subject, html });
}

export async function sendReceiptEmail(params: {
  to: string;
  tenantName: string;
  amount: string;
  receiptNumber: string;
  /** Property the payment settles — tells the tenant what this is about. */
  propertyName: string;
  /** Landlord's name, so the tenant knows who the receipt came from. */
  ownerName?: string | null;
  pdf?: Buffer;
  locale?: Locale;
}): Promise<void> {
  const t = await emailTranslations(params.locale);
  const { subject, html } = receiptEmail({
    subject: t('receiptSubject', { number: params.receiptNumber }),
    title: t('receiptTitle'),
    body: t('receiptBody', {
      name: params.tenantName,
      amount: `<strong>${params.amount}</strong>`,
      number: params.receiptNumber,
      property: params.propertyName,
    }),
    from: params.ownerName
      ? t('receiptFrom', { owner: params.ownerName })
      : undefined,
    note: t('receiptNoReply'),
    footer: t('footer'),
  });
  await deliver({
    to: params.to,
    subject,
    html,
    attachments: params.pdf
      ? [{ filename: `${params.receiptNumber}.pdf`, content: params.pdf }]
      : undefined,
  });
}

/** One owner's digest: the recipient plus their already-translated items. */
export type ReminderDigest = {
  /** Opaque caller reference, echoed back for the digests that were accepted. */
  ref: string;
  to: string;
  name?: string | null;
  /** Plain text, translated into the owner's language by the caller. */
  items: { heading: string; body: string }[];
  locale?: Locale;
};

/** Resend accepts at most 100 messages per batch call. */
const BATCH_SIZE = 100;

/**
 * Send the daily reminder digests in batched Resend calls.
 *
 * Returns the `ref`s that were accepted — NOT a count. The caller stamps only
 * those as emailed, so a chunk that fails is simply retried on the next run
 * instead of being silently marked as delivered.
 *
 * Batching matters twice over: the cron route caps at 60s (a hundred
 * sequential sends would flirt with that), and one call per chunk keeps a
 * morning burst from tripping the provider's per-second limits.
 */
export async function sendReminderDigestEmails(
  digests: ReminderDigest[],
): Promise<string[]> {
  if (digests.length === 0) return [];

  const resend = getResend();
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set. Would send ${digests.length} reminder digest(s).`,
    );
    return [];
  }

  const sent: string[] = [];

  for (let start = 0; start < digests.length; start += BATCH_SIZE) {
    const chunk = digests.slice(start, start + BATCH_SIZE);
    const messages = await Promise.all(
      chunk.map(async (digest) => {
        const t = await emailTranslations(digest.locale);
        const { subject, html } = reminderDigestEmail({
          subject: t('digestSubject', { count: digest.items.length }),
          title: t('digestTitle'),
          intro: digest.name
            ? t('digestIntroNamed', { name: digest.name })
            : t('digestIntro'),
          items: digest.items,
          ctaHref: `${APP_URL}/app/notifications`,
          ctaLabel: t('digestCta'),
          manage: t('digestManage'),
          footer: t('footer'),
        });
        return { from: EMAIL_FROM, to: digest.to, subject, html };
      }),
    );

    const { error } = await resend.batch.send(messages);
    if (error) {
      // Leave the whole chunk unstamped; the next run picks it up again.
      console.error('[email] reminder digest batch failed', error);
      continue;
    }
    sent.push(...chunk.map((digest) => digest.ref));
  }

  return sent;
}

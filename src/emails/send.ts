import 'server-only';
import { getTranslations } from 'next-intl/server';
import { clientEnv } from '@/shared/config/env';
import { EMAIL_FROM, getResend } from './client';
import {
  receiptEmail,
  resetPasswordEmail,
  verifyEmail,
  welcomeEmail,
} from './templates';

type Attachment = { filename: string; content: Buffer };

const APP = clientEnv.NEXT_PUBLIC_APP_NAME;
const APP_URL = clientEnv.NEXT_PUBLIC_APP_URL;

/** Email copy follows the request locale (the acting user's language). */
function emailTranslations() {
  return getTranslations('emails');
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
}): Promise<void> {
  const t = await emailTranslations();
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
}): Promise<void> {
  const t = await emailTranslations();
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
  pdf?: Buffer;
}): Promise<void> {
  const t = await emailTranslations();
  const { subject, html } = receiptEmail({
    subject: t('receiptSubject', { number: params.receiptNumber }),
    title: t('receiptTitle'),
    body: t('receiptBody', {
      name: params.tenantName,
      amount: `<strong>${params.amount}</strong>`,
      number: params.receiptNumber,
    }),
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

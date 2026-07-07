import 'server-only';
import { EMAIL_FROM, getResend } from './client';
import {
  receiptEmail,
  resetPasswordEmail,
  verifyEmail,
  welcomeEmail,
} from './templates';

type Attachment = { filename: string; content: Buffer };

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
  const { subject, html } = welcomeEmail(params.name);
  await deliver({ to: params.to, subject, html });
}

export async function sendResetPasswordEmail(params: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  const { subject, html } = resetPasswordEmail(params.resetUrl);
  await deliver({ to: params.to, subject, html });
}

export async function sendVerifyEmail(params: {
  to: string;
  verifyUrl: string;
}): Promise<void> {
  const { subject, html } = verifyEmail(params.verifyUrl);
  await deliver({ to: params.to, subject, html });
}

export async function sendReceiptEmail(params: {
  to: string;
  tenantName: string;
  amount: string;
  receiptNumber: string;
  pdf?: Buffer;
}): Promise<void> {
  const { subject, html } = receiptEmail(params);
  await deliver({
    to: params.to,
    subject,
    html,
    attachments: params.pdf
      ? [{ filename: `${params.receiptNumber}.pdf`, content: params.pdf }]
      : undefined,
  });
}

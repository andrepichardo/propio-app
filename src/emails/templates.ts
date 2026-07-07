import { clientEnv } from '@/shared/config/env';

/**
 * Minimal, dependency-free HTML email templates. Kept inline (rather than
 * React Email) so the transactional layer has zero render dependencies and
 * stays trivially portable. Swap for react-email later without touching
 * callers in `send.ts`.
 */
const brand = {
  name: clientEnv.NEXT_PUBLIC_APP_NAME,
  color: '#4f46e5',
  url: clientEnv.NEXT_PUBLIC_APP_URL,
};

function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2430;">
    <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
      <div style="font-weight:600;font-size:18px;color:${brand.color};margin-bottom:24px;">${brand.name}</div>
      <div style="background:#ffffff;border:1px solid #eceef1;border-radius:14px;padding:28px;">
        <h1 style="margin:0 0 12px;font-size:18px;">${title}</h1>
        ${body}
      </div>
      <p style="color:#8a909c;font-size:12px;margin-top:20px;">© ${new Date().getFullYear()} ${brand.name}. Manage your properties with confidence.</p>
    </div>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${brand.color};color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">${label}</a>`;
}

export function welcomeEmail(name?: string | null): {
  subject: string;
  html: string;
} {
  return {
    subject: `Welcome to ${brand.name}`,
    html: layout(
      `Welcome${name ? `, ${name}` : ''} 👋`,
      `<p style="font-size:14px;line-height:1.6;color:#4a5160;">Your ${brand.name} account is ready. Add your first property and start managing rentals, tenants and payments from one place.</p>
       <p style="margin-top:20px;">${button(`${brand.url}/app`, 'Open your dashboard')}</p>`,
    ),
  };
}

export function resetPasswordEmail(resetUrl: string): {
  subject: string;
  html: string;
} {
  return {
    subject: `Reset your ${brand.name} password`,
    html: layout(
      'Reset your password',
      `<p style="font-size:14px;line-height:1.6;color:#4a5160;">We received a request to reset your password. This link expires in 1 hour. If you didn’t request this, you can safely ignore this email.</p>
       <p style="margin-top:20px;">${button(resetUrl, 'Reset password')}</p>`,
    ),
  };
}

export function verifyEmail(verifyUrl: string): {
  subject: string;
  html: string;
} {
  return {
    subject: `Verify your ${brand.name} email`,
    html: layout(
      'Confirm your email',
      `<p style="font-size:14px;line-height:1.6;color:#4a5160;">Confirm this email address to secure your account.</p>
       <p style="margin-top:20px;">${button(verifyUrl, 'Verify email')}</p>`,
    ),
  };
}

export function receiptEmail(params: {
  tenantName: string;
  amount: string;
  receiptNumber: string;
}): { subject: string; html: string } {
  return {
    subject: `Receipt ${params.receiptNumber}`,
    html: layout(
      'Payment received',
      `<p style="font-size:14px;line-height:1.6;color:#4a5160;">Hi ${params.tenantName}, we’ve recorded your payment of <strong>${params.amount}</strong>. Your receipt ${params.receiptNumber} is attached.</p>`,
    ),
  };
}

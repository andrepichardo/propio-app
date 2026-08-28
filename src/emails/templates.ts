import { clientEnv } from '@/shared/config/env';

/**
 * Minimal, dependency-free HTML email templates. Presentational only: all
 * copy is passed in already translated (see `send.ts`), so the transactional
 * layer stays locale-agnostic and trivially portable.
 */
const brand = {
  name: clientEnv.NEXT_PUBLIC_APP_NAME,
  color: '#48509e',
  url: clientEnv.NEXT_PUBLIC_APP_URL,
};

export { brand as emailBrand };

function layout(title: string, body: string, footer: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2430;">
    <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
      <div style="font-weight:600;font-size:18px;color:${brand.color};margin-bottom:24px;">${brand.name}</div>
      <div style="background:#ffffff;border:1px solid #eceef1;border-radius:14px;padding:28px;">
        <h1 style="margin:0 0 12px;font-size:18px;">${title}</h1>
        ${body}
      </div>
      <p style="color:#8a909c;font-size:12px;margin-top:20px;">© ${new Date().getFullYear()} ${brand.name}. ${footer}</p>
    </div>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${brand.color};color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">${label}</a>`;
}

function paragraph(html: string): string {
  return `<p style="font-size:14px;line-height:1.6;color:#4a5160;">${html}</p>`;
}

/**
 * Escape text that came from the owner's own data (property and tenant names)
 * before it lands in an HTML email. The other templates interpolate copy we
 * wrote — the digest interpolates records someone typed.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function welcomeEmail(p: {
  subject: string;
  title: string;
  body: string;
  cta: string;
  footer: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: p.subject,
    html: layout(
      p.title,
      `${paragraph(p.body)}
       <p style="margin-top:20px;">${button(p.dashboardUrl, p.cta)}</p>`,
      p.footer,
    ),
  };
}

export function resetPasswordEmail(p: {
  subject: string;
  title: string;
  body: string;
  cta: string;
  footer: string;
  resetUrl: string;
}): { subject: string; html: string } {
  return {
    subject: p.subject,
    html: layout(
      p.title,
      `${paragraph(p.body)}
       <p style="margin-top:20px;">${button(p.resetUrl, p.cta)}</p>`,
      p.footer,
    ),
  };
}

export function verifyEmail(p: {
  subject: string;
  title: string;
  body: string;
  cta: string;
  footer: string;
  verifyUrl: string;
}): { subject: string; html: string } {
  return {
    subject: p.subject,
    html: layout(
      p.title,
      `${paragraph(p.body)}
       <p style="margin-top:20px;">${button(p.verifyUrl, p.cta)}</p>`,
      p.footer,
    ),
  };
}

export function receiptEmail(p: {
  subject: string;
  title: string;
  body: string;
  /** "Sent by <landlord>" line; omitted when the owner has no name set. */
  from?: string;
  /**
   * Reply guidance. Receipts go out from `no-reply@`, which has no mailbox —
   * a tenant who hits Reply gets a hard bounce ("User does not exist"), so the
   * email has to point them somewhere. Always rendered, even when the owner
   * has no name set and the `from` line is omitted.
   */
  note: string;
  footer: string;
}): { subject: string; html: string } {
  const lines = [p.from, p.note].filter(Boolean);
  const footnotes = `<div style="margin:16px 0 0;border-top:1px solid #eceef1;padding-top:14px;">${lines
    .map(
      (line) =>
        `<p style="font-size:13px;line-height:1.6;color:#8a909c;margin:0 0 6px;">${line}</p>`,
    )
    .join('')}</div>`;
  return {
    subject: p.subject,
    html: layout(p.title, `${paragraph(p.body)}${footnotes}`, p.footer),
  };
}

/**
 * Daily reminder digest: ONE email per owner listing everything that needs
 * attention, instead of one email per reminder. That is what keeps the whole
 * feature inside a free sending tier — a portfolio whose due days cluster on
 * the 1st would otherwise fire dozens of messages in a single morning.
 *
 * `items` are plain text (already translated into the owner's language from
 * the `notifications` namespace) and are escaped here.
 */
export function reminderDigestEmail(p: {
  subject: string;
  title: string;
  intro: string;
  items: { heading: string; body: string }[];
  ctaHref: string;
  ctaLabel: string;
  manage: string;
  footer: string;
}): { subject: string; html: string } {
  const list = p.items
    .map(
      (item, index) =>
        `<div style="padding:14px 0;${index === 0 ? '' : 'border-top:1px solid #eceef1;'}">
          <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#1f2430;">${escapeHtml(item.heading)}</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#4a5160;">${escapeHtml(item.body)}</p>
        </div>`,
    )
    .join('');

  const body = `${paragraph(p.intro)}
    <div style="margin:18px 0 24px;">${list}</div>
    ${button(p.ctaHref, p.ctaLabel)}
    <p style="font-size:12px;line-height:1.6;color:#8a909c;margin:20px 0 0;border-top:1px solid #eceef1;padding-top:14px;">${p.manage}</p>`;

  return { subject: p.subject, html: layout(p.title, body, p.footer) };
}

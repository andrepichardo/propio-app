import { describe, expect, it } from 'vitest';
import { receiptEmail, reminderDigestEmail } from '../templates';

/**
 * The digest is the one template that interpolates the OWNER'S OWN DATA —
 * property and tenant names — rather than copy we wrote. A name containing
 * markup would otherwise break the layout of every recipient's email, so the
 * escaping is worth pinning down.
 */
describe('reminderDigestEmail', () => {
  const base = {
    subject: 'You have 2 reminders',
    title: 'This needs your attention',
    intro: 'Here is what Propio found this morning.',
    ctaHref: 'https://usepropio.com/app/notifications',
    ctaLabel: 'Open my dashboard',
    manage: 'Turn these off in Settings.',
    footer: 'Manage your properties with confidence.',
  };

  it('escapes markup coming from property and tenant names', () => {
    const { html } = reminderDigestEmail({
      ...base,
      items: [
        {
          heading: 'Rent payment overdue',
          body: '<script>alert("x")</script> owes RD$ 42,000 & counting',
        },
      ],
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp; counting');
    expect(html).toContain('&quot;x&quot;');
  });

  it('renders one block per reminder and keeps their order', () => {
    const { html, subject } = reminderDigestEmail({
      ...base,
      items: [
        { heading: 'First reminder', body: 'Body one' },
        { heading: 'Second reminder', body: 'Body two' },
      ],
    });

    expect(subject).toBe(base.subject);
    expect(html.indexOf('First reminder')).toBeLessThan(
      html.indexOf('Second reminder'),
    );
    // The separator is drawn between blocks, so N items carry N-1 of them.
    expect(html.split('border-top:1px solid #eceef1;').length - 1).toBe(
      // one between the two items, one above the "manage" footnote
      2,
    );
  });

  it('links the call to action at the given URL', () => {
    const { html } = reminderDigestEmail({
      ...base,
      items: [{ heading: 'A', body: 'B' }],
    });

    expect(html).toContain(`href="${base.ctaHref}"`);
    expect(html).toContain(base.ctaLabel);
  });
});

describe('receiptEmail', () => {
  it('always renders the no-reply note, even without a sender line', () => {
    const note = 'This mailbox does not accept replies.';
    const withoutOwner = reminderNote({ note });
    const withOwner = reminderNote({ note, from: 'Sent by Carlos.' });

    expect(withoutOwner).toContain(note);
    expect(withOwner).toContain(note);
    expect(withOwner).toContain('Sent by Carlos.');
  });

  function reminderNote(extra: { note: string; from?: string }): string {
    return receiptEmail({
      subject: 'Receipt REC-1',
      title: 'Payment received',
      body: 'Body',
      footer: 'Footer',
      ...extra,
    }).html;
  }
});

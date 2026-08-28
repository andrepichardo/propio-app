import { getLocale, getTranslations } from 'next-intl/server';

const SITE_URL = 'https://usepropio.com';

/** Same keys the FAQ section renders — the two must not drift apart. */
const QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'] as const;

/**
 * Structured data for the landing: the product itself plus the FAQ.
 *
 * Rich results are only granted for content the visitor can actually see, so
 * the questions here are read from the same catalogue keys the accordion
 * renders — never a separate, SEO-only list.
 */
export async function LandingJsonLd() {
  const locale = await getLocale();
  const site = await getTranslations('site');
  const faq = await getTranslations('landing.faq');

  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Propio',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: SITE_URL,
      description: site('description'),
      inLanguage: locale,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: QUESTIONS.map((key) => ({
        '@type': 'Question',
        name: faq(`${key}.q`),
        acceptedAnswer: { '@type': 'Answer', text: faq(`${key}.a`) },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // The payload is built from our own message catalogue, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

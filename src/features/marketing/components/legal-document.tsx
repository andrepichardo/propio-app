import { getTranslations } from 'next-intl/server';
import { GridPattern } from './backdrop';

/**
 * Renderer for the long-form legal pages (`/terms`, `/privacy`).
 *
 * The documents live entirely in the message catalogues as an array of
 * sections, so both locales stay in lockstep and editing a clause never means
 * touching a component. `t.raw()` hands back untyped JSON, so it is narrowed
 * here instead of being trusted.
 */

interface LegalSection {
  title: string;
  body: string[];
  bullets: string[];
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function parseSections(value: unknown): LegalSection[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry): LegalSection[] => {
    if (typeof entry !== 'object' || entry === null) return [];
    const record = entry as Record<string, unknown>;
    if (typeof record.title !== 'string') return [];
    return [
      {
        title: record.title,
        body: asStringArray(record.body),
        bullets: asStringArray(record.bullets),
      },
    ];
  });
}

function slugify(value: string, index: number): string {
  const slug = value
    .toLowerCase()
    .normalize('NFD')
    // NFD + strip the combining marks, so accented Spanish headings still
    // produce clean ASCII anchors.
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `${index + 1}-${slug}` : `section-${index + 1}`;
}

export async function LegalDocument({
  namespace,
}: {
  /** Message namespace holding the document, e.g. `legal.terms`. */
  namespace: 'legal.terms' | 'legal.privacy';
}) {
  const t = await getTranslations(namespace);
  const tc = await getTranslations('legal');
  const sections = parseSections(t.raw('sections'));

  // Same pull-up as the hero: the grid runs behind the transparent header
  // instead of starting with a hard seam under it.
  return (
    <div className="relative isolate -mt-16">
      <GridPattern fade="top" className="-z-10" />

      <div className="container pt-32 pb-16 sm:pt-40 sm:pb-24">
        <header className="mx-auto max-w-3xl">
          <p className="text-primary text-xs font-semibold tracking-[0.14em] uppercase">
            {tc('eyebrow')}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-4 text-sm">
            {tc('lastUpdated')}: {t('updated')}
          </p>
          <p className="text-muted-foreground mt-6 text-base leading-relaxed">
            {t('intro')}
          </p>
        </header>

        <div className="mx-auto mt-14 grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
          <article className="min-w-0 space-y-12">
            {sections.map((section, index) => {
              const id = slugify(section.title, index);
              return (
                <section key={id} id={id} className="scroll-mt-24">
                  <h2 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
                    <span className="text-primary mr-2">{index + 1}.</span>
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4">
                    {section.body.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-muted-foreground text-sm leading-relaxed sm:text-[0.95rem]"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {section.bullets.length > 0 ? (
                    <ul className="mt-4 space-y-2.5">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="text-muted-foreground flex gap-3 text-sm leading-relaxed"
                        >
                          <span
                            aria-hidden
                            className="bg-primary/60 mt-2 size-1.5 shrink-0 rounded-full"
                          />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              );
            })}

            <div className="bg-muted/30 rounded-2xl border p-6">
              <h2 className="text-base font-semibold">{tc('contactTitle')}</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {tc('contactBody')}{' '}
                <a
                  href={`mailto:${tc('contactEmail')}`}
                  className="text-primary font-medium underline-offset-4 hover:underline"
                >
                  {tc('contactEmail')}
                </a>
                .
              </p>
            </div>
          </article>

          {/* Sticky table of contents. Purely a convenience, so it is hidden
              rather than reflowed on small screens. */}
          <nav
            aria-label={tc('tocLabel')}
            className="hidden lg:sticky lg:top-24 lg:block lg:self-start"
          >
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
              {tc('tocLabel')}
            </p>
            <ol className="mt-4 space-y-2.5 border-l">
              {sections.map((section, index) => (
                <li key={section.title}>
                  <a
                    href={`#${slugify(section.title, index)}`}
                    className="text-muted-foreground hover:border-primary hover:text-foreground -ml-px block border-l border-transparent py-0.5 pl-4 text-sm transition-colors"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
    </div>
  );
}

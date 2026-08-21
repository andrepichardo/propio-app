'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  greetingKey,
  msUntilNextHour,
  type GreetingKey,
} from '@/shared/lib/greeting';

/**
 * Time-of-day greeting resolved against the BROWSER's clock.
 *
 * It has to run on the client: the server has no idea what time it is for the
 * visitor (its own clock is UTC in production, and `User.timezone` is unused),
 * so a server-rendered greeting is wrong for anyone outside UTC — e.g. 00:30 in
 * the Dominican Republic is 04:30 UTC, which used to read "Buenos días".
 *
 * `initialKey` (the server's best guess) seeds the first render so hydration
 * matches; the effect then corrects it and re-checks every hour, so a dashboard
 * left open crosses into the next band on its own.
 */
export function Greeting({
  name,
  initialKey,
}: {
  name?: string;
  initialKey: GreetingKey;
}) {
  const t = useTranslations('dashboard');
  const [key, setKey] = useState<GreetingKey>(initialKey);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const sync = () => {
      const now = new Date();
      setKey(greetingKey(now));
      timer = setTimeout(sync, msUntilNextHour(now));
    };
    sync();
    return () => clearTimeout(timer);
  }, []);

  const greeting = t(key);
  return <>{name ? t('greetingName', { greeting, name }) : greeting}</>;
}

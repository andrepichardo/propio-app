export type GreetingKey =
  'greetingMorning' | 'greetingAfternoon' | 'greetingEvening';

/**
 * Time-of-day greeting bands, tuned to the Spanish/LatAm convention (the app's
 * primary audience): the early hours are "buenas noches", NOT "buenos días".
 *
 *   05:00 – 11:59  buenos días    / good morning
 *   12:00 – 18:59  buenas tardes  / good afternoon
 *   19:00 – 04:59  buenas noches  / good evening
 *
 * Reads LOCAL hours on purpose — call it with a date whose local time is the
 * user's (i.e. from the browser), never from the server, whose clock is UTC in
 * production.
 */
export function greetingKey(date: Date): GreetingKey {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'greetingMorning';
  if (hour >= 12 && hour < 19) return 'greetingAfternoon';
  return 'greetingEvening';
}

/** Milliseconds until the next full hour — when the greeting may change. */
export function msUntilNextHour(date: Date): number {
  const next = new Date(date);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next.getTime() - date.getTime();
}

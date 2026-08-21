import { describe, expect, it } from 'vitest';
import { greetingKey, msUntilNextHour } from '../greeting';

/** Local-time date at the given hour (the helper reads local hours). */
function at(hour: number, minute = 0) {
  return new Date(2026, 7, 21, hour, minute, 0, 0);
}

describe('greetingKey', () => {
  it('greets the small hours as evening, not morning', () => {
    // The reported bug: 12 AM used to read "Buenos días".
    expect(greetingKey(at(0))).toBe('greetingEvening');
    expect(greetingKey(at(2, 30))).toBe('greetingEvening');
    expect(greetingKey(at(4, 59))).toBe('greetingEvening');
  });

  it('covers each band', () => {
    expect(greetingKey(at(5))).toBe('greetingMorning');
    expect(greetingKey(at(9))).toBe('greetingMorning');
    expect(greetingKey(at(11, 59))).toBe('greetingMorning');

    expect(greetingKey(at(12))).toBe('greetingAfternoon');
    expect(greetingKey(at(15))).toBe('greetingAfternoon');
    expect(greetingKey(at(18, 59))).toBe('greetingAfternoon');

    expect(greetingKey(at(19))).toBe('greetingEvening');
    expect(greetingKey(at(23, 59))).toBe('greetingEvening');
  });

  it('assigns every hour of the day exactly one greeting', () => {
    const keys = Array.from({ length: 24 }, (_, hour) => greetingKey(at(hour)));
    expect(keys.filter((k) => k === 'greetingMorning')).toHaveLength(7);
    expect(keys.filter((k) => k === 'greetingAfternoon')).toHaveLength(7);
    expect(keys.filter((k) => k === 'greetingEvening')).toHaveLength(10);
  });
});

describe('msUntilNextHour', () => {
  it('counts down to the top of the next hour', () => {
    expect(msUntilNextHour(at(10, 0))).toBe(60 * 60 * 1000);
    expect(msUntilNextHour(at(10, 59))).toBe(60 * 1000);
  });

  it('rolls over midnight', () => {
    const nearMidnight = new Date(2026, 7, 21, 23, 30, 0, 0);
    const next = new Date(
      nearMidnight.getTime() + msUntilNextHour(nearMidnight),
    );
    expect(next.getDate()).toBe(22);
    expect(next.getHours()).toBe(0);
  });
});

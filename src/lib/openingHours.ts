import { useEffect, useState } from 'react';
import { siteConfig } from '@/config/site';

export const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export type DayKey = (typeof DAY_KEYS)[number];
export type DayHours = { open: string; close: string; closed: boolean };
export type OpeningHours = Record<DayKey, DayHours>;

export const WEEK_ORDER: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const DAY_LABELS: Record<DayKey, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

const HOURS_EVENT = 'opening-hours-updated';

const defaultDay = (): DayHours => ({
  open: siteConfig.hours.opening,
  close: siteConfig.hours.lastBookingTime,
  closed: false,
});

export const defaultOpeningHours = (): OpeningHours =>
  Object.fromEntries(DAY_KEYS.map((key) => [key, defaultDay()])) as OpeningHours;

const clock = (value: unknown, fallback: string) =>
  typeof value === 'string' && /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : fallback;

export const parseOpeningHours = (value: unknown): OpeningHours => {
  const hours = defaultOpeningHours();
  if (!value || typeof value !== 'object') return hours;
  const source = value as Record<string, unknown>;
  DAY_KEYS.forEach((key) => {
    const raw = source[key];
    if (!raw || typeof raw !== 'object') return;
    const day = raw as Record<string, unknown>;
    hours[key] = {
      open: clock(day.open, hours[key].open),
      close: clock(day.close, hours[key].close),
      closed: day.closed === true,
    };
  });
  return hours;
};

let openingHours = defaultOpeningHours();

export const getOpeningHours = () => openingHours;

export const rememberOpeningHours = (value: unknown) => {
  openingHours = parseOpeningHours(value);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(HOURS_EVENT));
  }
};

export const dayKeyFor = (date: Date): DayKey => DAY_KEYS[date.getDay()];

export const hoursForDate = (date: Date) => openingHours[dayKeyFor(date)];

export const isDayClosed = (date: Date) => hoursForDate(date).closed;

export const useOpeningHours = () => {
  const [hours, setHours] = useState(getOpeningHours);
  useEffect(() => {
    const refresh = () => setHours(getOpeningHours());
    window.addEventListener(HOURS_EVENT, refresh);
    return () => window.removeEventListener(HOURS_EVENT, refresh);
  }, []);
  return hours;
};

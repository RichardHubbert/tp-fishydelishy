import { siteConfig } from '@/config/site';
import { hoursForDate, isDayClosed } from '@/lib/openingHours';

export const BOOKING_NOTICE_MINUTES = 60;

export const NOTICE_OPTIONS = [
  { minutes: 0, label: 'Next slot' },
  { minutes: 30, label: '30 minutes' },
  { minutes: 60, label: '1 hour' },
  { minutes: 90, label: '1 hour 30' },
  { minutes: 120, label: '2 hours' },
] as const;

const STORAGE_KEY = 'booking-notice-minutes';

const readStoredNotice = () => {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    if (NOTICE_OPTIONS.some((option) => option.minutes === stored)) return stored;
  } catch {
    // Private browsing can block storage. The in-memory default still applies.
  }
  return BOOKING_NOTICE_MINUTES;
};

let bookingNoticeMinutes = readStoredNotice();

export const getBookingNoticeMinutes = () => bookingNoticeMinutes;

export const setBookingNoticeMinutes = (minutes: number) => {
  if (!NOTICE_OPTIONS.some((option) => option.minutes === minutes)) return;
  bookingNoticeMinutes = minutes;
  try {
    localStorage.setItem(STORAGE_KEY, String(minutes));
  } catch {
    // The current tab still uses the new value through the event below.
  }
  window.dispatchEvent(new Event('booking-notice-updated'));
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    bookingNoticeMinutes = readStoredNotice();
    window.dispatchEvent(new Event('booking-notice-updated'));
  });
}

const toMinutes = (time: string) => {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

const clock = (total: number) => {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const bookingSlots = (date?: Date): string[] => {
  const day = date ? hoursForDate(date) : null;
  if (day?.closed) return [];
  const start = toMinutes(day?.open || siteConfig.hours.opening);
  const end = toMinutes(day?.close || siteConfig.hours.lastBookingTime);
  const interval = siteConfig.hours.slotInterval || 30;
  const slots: string[] = [];
  for (let minute = start; minute <= end; minute += interval) {
    slots.push(clock(minute));
  }
  return slots;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const slotDateTime = (date: Date, time: string) => {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
};

export const isAdvanceBookable = (date: Date, time: string, now = new Date()) => {
  if (startOfDay(date).getTime() < startOfDay(now).getTime()) return false;
  if (isDayClosed(date)) return false;
  if (!bookingSlots(date).includes(time.slice(0, 5))) return false;
  const earliest = now.getTime() + getBookingNoticeMinutes() * 60 * 1000;
  return slotDateTime(date, time).getTime() >= earliest;
};

export const customerBookingSlots = (date: Date, now = new Date()) =>
  bookingSlots(date).filter((time) => isAdvanceBookable(date, time, now));

export const nextBookableSlot = (now = new Date()) => {
  for (let offset = 0; offset < 14; offset += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    const time = customerBookingSlots(day, now)[0];
    if (time) return { date: day, time };
  }
  return null;
};

export const formatClockLabel = (time: string) => {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 || 12;
  return minutes === 0 ? `${hour}:00 ${suffix}` : `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

export const formatNextBooking = (
  slot: { date: Date; time: string } | null,
  now = new Date(),
) => {
  if (!slot) return 'Closed';
  const time = formatClockLabel(slot.time);
  const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((dayStart(slot.date) - dayStart(now)) / 86_400_000);
  if (days <= 0) return time;
  if (days === 1) return `Tomorrow, ${time}`;
  const day = slot.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day}, ${time}`;
};

export const noticeLeadLabel = () =>
  NOTICE_OPTIONS.find((option) => option.minutes === getBookingNoticeMinutes())?.label
  || `${getBookingNoticeMinutes()} minutes`;

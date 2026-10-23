import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Calendar, ChevronDown, Clock, TrendingUp, Users } from 'lucide-react';
import { format } from 'date-fns';
import {
  countBookingsCreatedToday,
  getAvailableTimeSlots,
  requestBookingAlert,
} from '@/services/supabaseBookingService';
import { customerBookingSlots, getBookingNoticeMinutes } from '@/lib/bookingNotice';
import { isDayClosed, useOpeningHours } from '@/lib/openingHours';

export interface BookingSelection {
  date: string;
  time: string;
  partySize: number;
  step: number;
}

interface BookingCardProps {
  restaurantId: string;
  onBook: (selection: BookingSelection) => void;
}

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8];

const upcomingDates = () => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
};

const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDateLabel = (value: string) => format(parseLocalDate(value), 'd MMM yyyy');

const BookingCard: React.FC<BookingCardProps> = ({ restaurantId, onBook }) => {
  const dates = useMemo(upcomingDates, []);
  const openingHours = useOpeningHours();
  const openDates = useMemo(
    () => dates.filter((value) => !isDayClosed(parseLocalDate(value))),
    [dates, openingHours],
  );
  const [notice, setNotice] = useState(getBookingNoticeMinutes());
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState(dates[0]);
  const [time, setTime] = useState('19:00');
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [bookedToday, setBookedToday] = useState(0);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyStatus, setNotifyStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const refresh = () => setNotice(getBookingNoticeMinutes());
    window.addEventListener('booking-notice-updated', refresh);
    return () => window.removeEventListener('booking-notice-updated', refresh);
  }, []);

  const times = useMemo(
    () => customerBookingSlots(parseLocalDate(date)),
    [date, notice, openingHours],
  );

  useEffect(() => {
    if (openDates.length > 0 && !openDates.includes(date)) {
      setDate(openDates[0]);
    }
  }, [openDates, date]);

  useEffect(() => {
    if (times.length > 0 && !times.includes(time)) {
      setTime(times[0]);
    }
  }, [times, time]);

  useEffect(() => {
    let cancelled = false;
    countBookingsCreatedToday(restaurantId).then((count) => {
      if (!cancelled) setBookedToday(count);
    });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  useEffect(() => {
    let cancelled = false;
    setSlotsLoading(true);
    getAvailableTimeSlots(parseLocalDate(date), partySize, restaurantId)
      .then((next) => {
        if (!cancelled) setSlots(next);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, partySize, restaurantId, notice, openingHours]);

  const nearby = useMemo(() => {
    const index = Math.max(0, times.indexOf(time));
    const start = Math.max(0, Math.min(index - 2, times.length - 5));
    const windowTimes = times.slice(start, start + 5);
    return windowTimes.map((slotTime) => ({
      time: slotTime,
      available: slots.find((slot) => slot.time === slotTime)?.available ?? false,
    }));
  }, [slots, time, times]);

  const openBooking = (selectedTime: string, step: number) => {
    onBook({ date, time: selectedTime, partySize, step });
  };

  const submitAlert = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotifyStatus('saving');
    try {
      await requestBookingAlert({
        restaurantId,
        email: notifyEmail,
        partySize,
        date,
        time,
      });
      setNotifyStatus('saved');
      setNotifyEmail('');
    } catch {
      setNotifyStatus('error');
    }
  };

  return (
    <section className="w-full rounded-xl border border-gray-200 bg-white p-6 text-slate-800 shadow-sm">
      <h2 className="mb-5 text-center text-[1.65rem] font-semibold tracking-tight text-slate-900">
        Make a booking
      </h2>

      <label className="mb-3 flex items-center gap-3 rounded-lg bg-slate-100 px-4 py-3">
        <Users className="h-5 w-5 shrink-0 text-slate-700" aria-hidden="true" />
        <span className="sr-only">Party size</span>
        <select
          className="w-full appearance-none bg-transparent text-base font-medium text-slate-800 outline-none"
          value={partySize}
          onChange={(event) => setPartySize(Number(event.target.value))}
        >
          {PARTY_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} {size === 1 ? 'person' : 'people'}
            </option>
          ))}
        </select>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-3">
          <Calendar className="h-5 w-5 shrink-0 text-slate-700" aria-hidden="true" />
          <span className="sr-only">Date</span>
          <select
            className="w-full appearance-none bg-transparent text-sm font-medium text-slate-800 outline-none"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          >
            {openDates.map((value) => (
              <option key={value} value={value}>
                {formatDateLabel(value)}
              </option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        </label>
        <label className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-3">
          <Clock className="h-5 w-5 shrink-0 text-slate-700" aria-hidden="true" />
          <span className="sr-only">Time</span>
          <select
            className="w-full appearance-none bg-transparent text-sm font-medium text-slate-800 outline-none"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          >
            {times.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        </label>
      </div>

      <h3 className="mb-3 mt-6 text-base font-semibold text-slate-900">Select a time</h3>
      <div className="flex flex-wrap gap-2">
        {slotsLoading && <p className="text-sm text-slate-500">Checking availability…</p>}
        {!slotsLoading && nearby.map((slot) => (
          <button
            key={slot.time}
            type="button"
            disabled={!slot.available}
            onClick={() => openBooking(slot.time, 4)}
            className={`min-w-[4.6rem] rounded-md px-3 py-2 text-sm font-semibold ${
              slot.available
                ? 'bg-[#e15d4f] text-white hover:bg-[#cf4e41]'
                : 'cursor-not-allowed bg-slate-100 text-slate-400'
            }`}
          >
            {slot.time}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setNotifyOpen((open) => !open)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#e15d4f] bg-white px-3 py-2 text-sm font-semibold text-[#e15d4f] hover:bg-red-50"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          Notify me
        </button>
      </div>

      {notifyOpen && (
        <form onSubmit={submitAlert} className="mt-3 flex gap-2">
          <label className="sr-only" htmlFor="booking-alert-email">Email</label>
          <input
            id="booking-alert-email"
            type="email"
            required
            value={notifyEmail}
            onChange={(event) => setNotifyEmail(event.target.value)}
            placeholder="Email address"
            className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#e15d4f]"
          />
          <button
            type="submit"
            disabled={notifyStatus === 'saving'}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {notifyStatus === 'saving' ? 'Saving…' : 'Send'}
          </button>
        </form>
      )}
      {notifyStatus === 'saved' && (
        <p className="mt-2 text-sm text-green-700">We’ll email you if a table opens.</p>
      )}
      {notifyStatus === 'error' && (
        <p className="mt-2 text-sm text-red-700">Couldn’t save that request. Try again.</p>
      )}

      <p className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-800">
        <TrendingUp className="h-4 w-4" aria-hidden="true" />
        Booked {bookedToday} {bookedToday === 1 ? 'time' : 'times'} today
      </p>

      <button
        type="button"
        onClick={() => openBooking(time, 3)}
        className="mt-4 w-full rounded-lg border border-slate-200 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
      >
        View full availability
      </button>
    </section>
  );
};

export default BookingCard;

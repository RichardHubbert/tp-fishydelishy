import React, { useEffect, useState } from 'react';
import {
  NOTICE_OPTIONS,
  formatNextBooking,
  getBookingNoticeMinutes,
  nextBookableSlot,
  setBookingNoticeMinutes,
} from '@/lib/bookingNotice';

const BookingNoticeControl = () => {
  const [notice, setNotice] = useState(getBookingNoticeMinutes());
  const [nextBooking, setNextBooking] = useState('…');

  useEffect(() => {
    const refresh = () => {
      setNotice(getBookingNoticeMinutes());
      setNextBooking(formatNextBooking(nextBookableSlot()));
    };
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener('booking-notice-updated', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('booking-notice-updated', refresh);
    };
  }, []);

  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      Notice
      <select
        aria-label="Booking notice"
        value={notice}
        onChange={(event) => setBookingNoticeMinutes(Number(event.target.value))}
        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900"
      >
        {NOTICE_OPTIONS.map((option) => (
          <option key={option.minutes} value={option.minutes}>{option.label}</option>
        ))}
      </select>
      <span className="whitespace-nowrap text-sm text-gray-500">Next {nextBooking}</span>
    </label>
  );
};

export default BookingNoticeControl;

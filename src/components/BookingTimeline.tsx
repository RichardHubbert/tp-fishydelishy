import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Inbox,
  LayoutGrid,
  List,
  Map as FloorPlanIcon,
  Minus,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
  Workflow,
} from 'lucide-react';
import type { Restaurant } from '@/services/restaurantService';
import type { Booking, Table as DiningTable } from '@/services/supabaseBookingService';
import BookingRequests, { isRequestExpired, loadBookingRequests, saveBookingRequests, type BookingRequest } from '@/components/BookingRequests';
import BookingOverview from '@/components/BookingOverview';
import BookingFlow from '@/components/BookingFlow';
import { cn } from '@/lib/utils';

const START_HOUR = 11;
const END_HOUR = 23;
const LABEL_WIDTH = 168;
const ZOOM_STEPS = [0.75, 1, 1.25, 1.5];

const VIEWS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'flow', label: 'Flow', icon: Workflow },
  { id: 'requests', label: 'Requests', icon: Inbox },
  { id: 'floor', label: 'Floor Plan', icon: FloorPlanIcon },
  { id: 'notify', label: 'Notify Me', icon: Bell },
  { id: 'list', label: 'List', icon: List },
  { id: 'smart', label: 'SmartSeat', icon: Sparkles },
] as const;

type ViewId = (typeof VIEWS)[number]['id'];
type RangeId = 'day' | 'week' | 'month';

const WEEK_START = { weekStartsOn: 1 as const };

const parseBookingDay = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

const stepDate = (date: Date, range: RangeId, direction: -1 | 1) => {
  if (range === 'week') return addWeeks(date, direction);
  if (range === 'month') return addMonths(date, direction);
  return addDays(date, direction);
};

const rangeLabel = (date: Date, range: RangeId) => {
  if (range === 'month') return format(date, 'MMMM yyyy');
  if (range === 'week') {
    const start = startOfWeek(date, WEEK_START);
    const end = endOfWeek(date, WEEK_START);
    return start.getMonth() === end.getMonth()
      ? `${format(start, 'd')}–${format(end, 'd MMM yyyy')}`
      : `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`;
  }
  return format(date, 'EEEE, MMMM d');
};

interface BookingTimelineProps {
  date: Date;
  onDateChange: (date: Date) => void;
  tables: DiningTable[];
  bookings: Booking[];
  schedule: Booking[];
  restaurants: Restaurant[];
  selectedRestaurantId: string;
  onRestaurantChange: (restaurantId: string) => void;
  onNewBooking: () => void;
  onMoveBooking: (booking: Booking, update: { tableId: string; startTime: string; endTime: string }) => Promise<void>;
  onSaveBooking: (booking: Booking, update: BookingDraft) => Promise<void>;
  onDuplicateBooking: (booking: Booking, update: BookingDraft) => Promise<{ id: string; date: string }>;
  onDeleteBooking: (booking: Booking) => Promise<void>;
  onAcceptRequest: (request: BookingRequest, slot: { time: string; tableId: string }) => Promise<void>;
}

type BookingDraft = {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  party_size: number;
  start_time: string;
  end_time: string;
  table_id: string;
  status: Booking['status'];
  special_requests?: string;
};

const actionError = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return fallback;
};

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

const formatClock = (time: string) => time.slice(0, 5);

const minutesToClock = (minutes: number) => {
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
};

const SNAP_MINUTES = 15;

type Tone = 'seated' | 'current' | 'upcoming';

const toneFor = (booking: Booking, date: Date): Tone => {
  const now = new Date();
  if (!isSameDay(date, now)) {
    return date < now ? 'seated' : 'upcoming';
  }
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(booking.start_time);
  const end = toMinutes(booking.end_time);
  if (nowMinutes >= end || booking.status === 'completed') return 'seated';
  if (nowMinutes >= start && nowMinutes < end) return 'current';
  return 'upcoming';
};

const toneClass: Record<Tone, string> = {
  seated: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  current: 'bg-orange-50 border-orange-200 text-orange-950',
  upcoming: 'bg-blue-50 border-blue-200 text-blue-950',
};

const STATUS_LABEL: Record<Booking['status'], string> = {
  confirmed: 'Booking confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const durationMinutes = (start: string, end: string) => {
  const span = toMinutes(end) - toMinutes(start);
  return span > 0 ? span : 90;
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours}h ${mins}min`;
  if (hours) return `${hours}h`;
  return `${mins}min`;
};

const START_SLOTS = Array.from({ length: ((22 * 60) - (11 * 60)) / 15 }, (_, index) => {
  const minutes = 11 * 60 + index * 15;
  return minutesToClock(minutes).slice(0, 5);
});

function ReservationEditor({
  booking,
  tables,
  saving,
  onClose,
  onViewTimeline,
  onSave,
  onDuplicate,
  onDelete,
}: {
  booking: Booking;
  tables: DiningTable[];
  saving: boolean;
  onClose: () => void;
  onViewTimeline: () => void;
  onSave: (update: BookingDraft) => void;
  onDuplicate: (update: BookingDraft) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(booking.customer_name);
  const [phone, setPhone] = useState(booking.customer_phone || '');
  const [email, setEmail] = useState(booking.customer_email || '');
  const [partySize, setPartySize] = useState(booking.party_size);
  const [duration, setDuration] = useState(durationMinutes(booking.start_time, booking.end_time));
  const [start, setStart] = useState(formatClock(booking.start_time));
  const [tableId, setTableId] = useState(booking.table_id);
  const [status, setStatus] = useState<Booking['status']>(booking.status);
  const [notes, setNotes] = useState(booking.special_requests || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setName(booking.customer_name);
    setPhone(booking.customer_phone || '');
    setEmail(booking.customer_email || '');
    setPartySize(booking.party_size);
    setDuration(durationMinutes(booking.start_time, booking.end_time));
    setStart(formatClock(booking.start_time));
    setTableId(booking.table_id);
    setStatus(booking.status);
    setNotes(booking.special_requests || '');
    setConfirmDelete(false);
  }, [booking]);

  const draft = (): BookingDraft => {
    const startMinutes = toMinutes(start);
    return {
      customer_name: name.trim(),
      customer_email: email.trim(),
      customer_phone: phone.trim(),
      party_size: partySize,
      start_time: minutesToClock(startMinutes),
      end_time: minutesToClock(startMinutes + duration),
      table_id: tableId,
      status,
      special_requests: notes.trim(),
    };
  };

  return (
    <aside className="flex w-full shrink-0 flex-col border-t border-gray-200 bg-white lg:w-80 lg:border-l lg:border-t-0">
      <div className="flex items-center gap-2 border-b border-gray-100 p-3">
        <button type="button" onClick={onViewTimeline} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
          View in timeline
        </button>
        <button type="button" onClick={onClose} className="ml-auto rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
          Close
        </button>
      </div>
      <div className="space-y-4 overflow-y-auto p-3">
        <label className="block text-xs font-medium text-gray-500">
          Guest
          <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
        </label>
        <label className="block text-xs font-medium text-gray-500">
          Phone
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+44 7400 123456" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
        </label>
        <label className="block text-xs font-medium text-gray-500">
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Guests</p>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-2 py-1">
              <button type="button" aria-label="Fewer guests" onClick={() => setPartySize((size) => Math.max(1, size - 1))} className="rounded-full p-1 hover:bg-gray-100"><Minus className="h-3.5 w-3.5" /></button>
              <span className="text-sm font-medium">{partySize}</span>
              <button type="button" aria-label="More guests" onClick={() => setPartySize((size) => Math.min(20, size + 1))} className="rounded-full p-1 hover:bg-gray-100"><Plus className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Duration</p>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-2 py-1">
              <button type="button" aria-label="Shorter duration" onClick={() => setDuration((value) => Math.max(30, value - 15))} className="rounded-full p-1 hover:bg-gray-100"><Minus className="h-3.5 w-3.5" /></button>
              <span className="text-xs font-medium">{formatDuration(duration)}</span>
              <button type="button" aria-label="Longer duration" onClick={() => setDuration((value) => Math.min(240, value + 15))} className="rounded-full p-1 hover:bg-gray-100"><Plus className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>
        <label className="block text-xs font-medium text-gray-500">
          Reservation status
          <select value={status} onChange={(event) => setStatus(event.target.value as Booking['status'])} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900">
            <option value="confirmed">Booking confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500">Start time</p>
          <div className="grid max-h-40 grid-cols-4 gap-1.5 overflow-y-auto">
            {START_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setStart(slot)}
                className={cn(
                  'rounded-lg border px-1 py-1.5 text-xs',
                  start === slot ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500">Tables</p>
          <div className="flex flex-wrap gap-1.5">
            {tables.map((table) => (
              <button
                key={table.id}
                type="button"
                onClick={() => setTableId(table.id)}
                className={cn(
                  'rounded-lg border px-2 py-1.5 text-left text-xs',
                  tableId === table.id ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                )}
              >
                <span className="block font-medium">{table.name}</span>
                <span className={tableId === table.id ? 'text-white/70' : 'text-gray-400'}>{table.section}</span>
              </button>
            ))}
          </div>
        </div>
        <label className="block text-xs font-medium text-gray-500">
          Staff notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
        </label>
      </div>
      <div className="mt-auto space-y-2 border-t border-gray-100 p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving || !name.trim() || !email.trim()}
            onClick={() => onDuplicate(draft())}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </button>
          {confirmDelete ? (
            <button
              type="button"
              disabled={saving}
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {saving ? 'Deleting...' : 'Confirm delete'}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Close</button>
          <button
            type="button"
            disabled={saving || !name.trim() || !email.trim()}
            onClick={() => onSave(draft())}
            className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </aside>
  );
}

function RangeCalendar({
  range,
  date,
  bookings,
  tables,
  selectedId,
  onSelectBooking,
  onOpenDay,
}: {
  range: 'week' | 'month';
  date: Date;
  bookings: Booking[];
  tables: DiningTable[];
  selectedId: string | null;
  onSelectBooking: (id: string) => void;
  onOpenDay: (day: Date) => void;
}) {
  const days = range === 'week'
    ? eachDayOfInterval({
        start: startOfWeek(date, WEEK_START),
        end: endOfWeek(date, WEEK_START),
      })
    : eachDayOfInterval({
        start: startOfWeek(startOfMonth(date), WEEK_START),
        end: endOfWeek(endOfMonth(date), WEEK_START),
      });

  const tableName = (id: string) => tables.find((table) => table.id === id)?.name;
  const pastDay = (day: Date) => isBefore(startOfDay(day), startOfDay(new Date()));
  const onDay = (day: Date) =>
    bookings
      .filter((booking) => isSameDay(parseBookingDay(booking.booking_date), day))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

  if (range === 'week') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-7">
        {days.map((day) => {
          const items = onDay(day);
          return (
            <div key={day.toISOString()} className={cn('min-h-48 border-b border-r border-gray-100 p-2', pastDay(day) && 'bg-gray-100 opacity-40')}>
              <button type="button" onClick={() => onOpenDay(day)} className="mb-2 flex items-center gap-2">
                <span className="text-xs font-medium uppercase text-gray-400">{format(day, 'EEE')}</span>
                <span className={cn('inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold', isToday(day) ? 'bg-neutral-900 text-white' : 'text-gray-900')}>
                  {format(day, 'd')}
                </span>
              </button>
              <div className="space-y-1">
                {items.length === 0 && <p className="text-xs text-gray-400">No bookings</p>}
                {items.map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => onSelectBooking(booking.id)}
                    className={cn(
                      'block w-full rounded-md border px-2 py-1 text-left text-xs',
                      selectedId === booking.id ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-blue-200 bg-blue-50 text-blue-950 hover:bg-blue-100'
                    )}
                  >
                    <span className="font-medium">{formatClock(booking.start_time)}</span>
                    <span className="mt-0.5 block truncate">{booking.customer_name}</span>
                    <span className={cn('block truncate', selectedId === booking.id ? 'text-white/70' : 'text-blue-800/70')}>
                      {booking.party_size} · {tableName(booking.table_id) || 'No table'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-gray-100 px-2 py-2 text-center text-[11px] font-medium uppercase text-gray-400">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const items = onDay(day);
          const inMonth = isSameMonth(day, date);
          const shown = items.slice(0, 3);
          return (
            <div key={day.toISOString()} className={cn('min-h-28 border-b border-r border-gray-100 p-1.5', pastDay(day) ? 'bg-gray-100 opacity-40' : !inMonth && 'bg-gray-50')}>
              <button
                type="button"
                onClick={() => onOpenDay(day)}
                className={cn(
                  'mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                  isToday(day) ? 'bg-neutral-900 text-white' : inMonth ? 'text-gray-900' : 'text-gray-400'
                )}
              >
                {format(day, 'd')}
              </button>
              <div className="space-y-0.5">
                {shown.map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => onSelectBooking(booking.id)}
                    className={cn(
                      'block w-full truncate rounded px-1 py-0.5 text-left text-[11px]',
                      selectedId === booking.id ? 'bg-neutral-900 text-white' : 'bg-blue-50 text-blue-950 hover:bg-blue-100'
                    )}
                  >
                    {formatClock(booking.start_time)} {booking.customer_name}
                  </button>
                ))}
                {items.length > shown.length && (
                  <button type="button" onClick={() => onOpenDay(day)} className="px-1 text-[11px] text-gray-500 hover:text-gray-800">
                    +{items.length - shown.length} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const BookingTimeline = ({
  date,
  onDateChange,
  tables,
  bookings,
  schedule,
  selectedRestaurantId,
  onNewBooking,
  onMoveBooking,
  onSaveBooking,
  onDuplicateBooking,
  onDeleteBooking,
  onAcceptRequest,
}: BookingTimelineProps) => {
  const [view, setView] = useState<ViewId>('timeline');
  const [range, setRange] = useState<RangeId>('day');
  const [zoomIndex, setZoomIndex] = useState(1);
  const [query, setQuery] = useState('');
  const [requests, setRequests] = useState<BookingRequest[]>(() => loadBookingRequests());
  const [listFilter, setListFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled' | 'notable'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [moves, setMoves] = useState<Record<string, { tableId: string; startTime: string; endTime: string }>>({});
  const [moveError, setMoveError] = useState<string | null>(null);
  const [drag, setDrag] = useState<{
    id: string;
    tableId: string;
    width: number;
    x: number;
    y: number;
    name: string;
    timeLabel: string;
    party: number;
  } | null>(null);
  const dragRef = useRef<{
    id: string;
    pointerId: number;
    startX: number;
    originLeft: number;
    left: number;
    duration: number;
    tableId: string;
    originTableId: string;
    originStart: string;
    width: number;
    offsetX: number;
    offsetY: number;
    name: string;
    party: number;
  } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const requestBadge = requests.filter((request) => request.status === 'open' && !isRequestExpired(request) && (!selectedRestaurantId || !request.restaurant_id || request.restaurant_id === selectedRestaurantId)).length;

  useEffect(() => {
    saveBookingRequests(requests);
  }, [requests]);
  const hourWidth = 148 * ZOOM_STEPS[zoomIndex];
  const gridWidth = (END_HOUR - START_HOUR) * hourWidth;
  const dayStart = START_HOUR * 60;
  const daySpan = (END_HOUR - START_HOUR) * 60;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setMoves((current) => {
      const next = { ...current };
      let changed = false;
      Object.keys(next).forEach((id) => {
        const booking = bookings.find((item) => item.id === id);
        if (!booking || (booking.table_id === next[id].tableId && formatClock(booking.start_time) === formatClock(next[id].startTime))) {
          delete next[id];
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [bookings]);

  const placedBooking = (booking: Booking): Booking => {
    const move = moves[booking.id];
    if (!move) return booking;
    return { ...booking, table_id: move.tableId, start_time: move.startTime, end_time: move.endTime };
  };

  const beginDrag = (event: React.PointerEvent<HTMLDivElement>, booking: Booking, left: number, width: number) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const placed = placedBooking(booking);
    const rect = event.currentTarget.getBoundingClientRect();
    const duration = Math.max(SNAP_MINUTES, toMinutes(placed.end_time) - toMinutes(placed.start_time));
    dragRef.current = {
      id: booking.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      originLeft: left,
      left,
      duration,
      tableId: placed.table_id,
      originTableId: placed.table_id,
      originStart: placed.start_time,
      width,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      name: booking.customer_name,
      party: booking.party_size,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      id: booking.id,
      tableId: placed.table_id,
      width,
      x: rect.left,
      y: rect.top,
      name: booking.customer_name,
      timeLabel: formatClock(placed.start_time),
      party: booking.party_size,
    });
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = dragRef.current;
    if (!current || event.pointerId !== current.pointerId) return;
    const snapPx = (SNAP_MINUTES / daySpan) * gridWidth;
    const maxLeft = Math.max(0, gridWidth - (current.duration / daySpan) * gridWidth);
    let left = current.originLeft + (event.clientX - current.startX);
    left = Math.round(left / snapPx) * snapPx;
    left = Math.min(Math.max(0, left), maxLeft);
    const target = document.elementsFromPoint(event.clientX, event.clientY)
      .map((node) => (node instanceof Element ? node.closest('[data-table-id]') : null))
      .find((node): node is HTMLElement => Boolean(node));
    const tableId = target?.dataset.tableId || current.tableId;
    current.left = left;
    current.tableId = tableId;
    const startMin = dayStart + (left / gridWidth) * daySpan;
    setDrag({
      id: current.id,
      tableId,
      width: current.width,
      x: event.clientX - current.offsetX,
      y: event.clientY - current.offsetY,
      name: current.name,
      timeLabel: formatClock(minutesToClock(startMin)),
      party: current.party,
    });
  };

  const endDrag = async (event: React.PointerEvent<HTMLDivElement>) => {
    const current = dragRef.current;
    if (!current || event.pointerId !== current.pointerId) return;
    dragRef.current = null;
    setDrag(null);
    const startMin = dayStart + (current.left / gridWidth) * daySpan;
    const startTime = minutesToClock(startMin);
    const endTime = minutesToClock(startMin + current.duration);
    const changed = current.tableId !== current.originTableId || formatClock(startTime) !== formatClock(current.originStart);
    if (!changed) {
      setSelectedId(current.id);
      return;
    }
    const endMin = startMin + current.duration;
    const overlaps = bookings.some((other) => {
      if (other.id === current.id) return false;
      const otherMove = moves[other.id];
      const otherTable = otherMove?.tableId || other.table_id;
      if (otherTable !== current.tableId) return false;
      const otherStart = toMinutes(otherMove?.startTime || other.start_time);
      const otherEnd = toMinutes(otherMove?.endTime || other.end_time);
      return startMin < otherEnd && endMin > otherStart;
    });
    if (overlaps) {
      setMoveError('That table already has a booking then.');
      return;
    }
    const booking = bookings.find((item) => item.id === current.id);
    if (!booking) return;
    setMoves((prev) => ({ ...prev, [current.id]: { tableId: current.tableId, startTime, endTime } }));
    setMoveError(null);
    try {
      await onMoveBooking(booking, { tableId: current.tableId, startTime, endTime });
    } catch (error) {
      setMoves((prev) => {
        const next = { ...prev };
        delete next[current.id];
        return next;
      });
      setMoveError(error instanceof Error ? error.message : 'Could not move that booking.');
    }
  };

  const filteredBookings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return bookings;
    return bookings.filter((booking) =>
      booking.customer_name.toLowerCase().includes(needle) ||
      booking.customer_email?.toLowerCase().includes(needle) ||
      booking.customer_phone?.toLowerCase().includes(needle) ||
      booking.special_requests?.toLowerCase().includes(needle)
    );
  }, [bookings, query]);

  const calendarBookings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return schedule.filter((booking) => {
      if (booking.status === 'cancelled') return false;
      if (selectedRestaurantId && booking.restaurant_id !== selectedRestaurantId) return false;
      if (!needle) return true;
      return (
        booking.customer_name.toLowerCase().includes(needle) ||
        booking.customer_email?.toLowerCase().includes(needle) ||
        booking.customer_phone?.toLowerCase().includes(needle) ||
        booking.special_requests?.toLowerCase().includes(needle)
      );
    });
  }, [schedule, selectedRestaurantId, query]);

  const listBookings = useMemo(() => {
    return filteredBookings.filter((booking) => {
      const placed = placedBooking(booking);
      if (listFilter === 'upcoming') return placed.status === 'confirmed';
      if (listFilter === 'completed') return placed.status === 'completed';
      if (listFilter === 'cancelled') return placed.status === 'cancelled';
      if (listFilter === 'notable') return !placed.table_id;
      return true;
    });
  }, [filteredBookings, listFilter, moves]);

  const selectedSource = schedule.find((booking) => booking.id === selectedId) || bookings.find((booking) => booking.id === selectedId) || null;
  const selectedBooking = selectedSource ? placedBooking(selectedSource) : null;

  const rows = useMemo(() => {
    const groups = new Map<string, DiningTable[]>();
    tables.forEach((table) => {
      const section = table.section?.trim() || 'Dining Room';
      const list = groups.get(section) || [];
      list.push(table);
      groups.set(section, list);
    });

    const built: Array<{ kind: 'section'; name: string } | { kind: 'table'; table: DiningTable }> = [];
    Array.from(groups.entries()).forEach(([name, list]) => {
      const sectionBookings = filteredBookings.filter((booking) =>
        list.some((table) => table.id === booking.table_id)
      );
      if (query.trim() && sectionBookings.length === 0) return;
      built.push({ kind: 'section', name });
      list
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        .forEach((table) => {
          if (query.trim() && !filteredBookings.some((booking) => booking.table_id === table.id)) return;
          built.push({ kind: 'table', table });
        });
    });
    return built;
  }, [tables, filteredBookings, query]);

  const now = new Date();
  const showNow = isSameDay(date, now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowOffset = ((nowMinutes - dayStart) / daySpan) * gridWidth;
  const nowVisible = showNow && nowOffset >= 0 && nowOffset <= gridWidth;

  useEffect(() => {
    if (view !== 'timeline' || range !== 'day') return;
    const node = timelineScrollRef.current;
    if (!node || !isSameDay(date, new Date())) return;
    const minutes = new Date().getHours() * 60 + new Date().getMinutes();
    const offset = ((minutes - dayStart) / daySpan) * gridWidth;
    if (offset < 0 || offset > gridWidth) return;
    node.scrollLeft = Math.max(0, LABEL_WIDTH + offset - node.clientWidth * 0.3);
  }, [view, range, date, zoomIndex, gridWidth, dayStart, daySpan]);

  const positionFor = (time: string) => ((toMinutes(time) - dayStart) / daySpan) * gridWidth;

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={range === 'day' ? 'Previous day' : range === 'week' ? 'Previous week' : 'Previous month'}
            onClick={() => onDateChange(stepDate(date, range, -1))}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[10.5rem] text-center text-sm font-semibold text-gray-900">
            {rangeLabel(date, range)}
          </span>
          <button
            type="button"
            aria-label={range === 'day' ? 'Next day' : range === 'week' ? 'Next week' : 'Next month'}
            onClick={() => onDateChange(stepDate(date, range, 1))}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex rounded-lg border border-gray-200 p-0.5">
          {(['day', 'week', 'month'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setRange(id)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium capitalize',
                range === id ? 'bg-neutral-900 text-white' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              {id}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onNewBooking}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-900"
        >
          <Plus className="h-4 w-4" />
          New booking
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500">
            <Search className="h-4 w-4" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={view === 'list' || view === 'requests' ? 'Name, phone number or email' : 'Search'}
              className={cn('bg-transparent text-gray-800 outline-none placeholder:text-gray-400', view === 'list' || view === 'requests' ? 'w-52' : 'w-28')}
            />
            <span className="rounded border border-gray-200 px-1 text-[10px] text-gray-400">⌘K</span>
          </label>
        </div>
      </div>

      {range === 'day' && <div className="flex gap-1 overflow-x-auto border-b border-gray-100 px-3">
        {VIEWS.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm',
                active
                  ? 'border-neutral-900 font-medium text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {item.id === 'requests' && requestBadge > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                  {requestBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>}

      {moveError && (
        <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{moveError}</p>
      )}

      <div className="flex flex-col lg:flex-row">
      <div className="min-w-0 flex-1">
      {range !== 'day' ? (
        <RangeCalendar
          range={range}
          date={date}
          bookings={calendarBookings}
          tables={tables}
          selectedId={selectedId}
          onSelectBooking={setSelectedId}
          onOpenDay={(day) => {
            onDateChange(day);
            setRange('day');
          }}
        />
      ) : view === 'requests' ? (
        <BookingRequests
          requests={requests}
          onChange={setRequests}
          tables={tables}
          bookings={schedule}
          selectedRestaurantId={selectedRestaurantId}
          query={query}
          onAccept={(request, slot) => onAcceptRequest(request, { time: slot.time, tableId: slot.table.id })}
        />
      ) : view === 'overview' ? (
        <BookingOverview
          date={date}
          tables={tables}
          bookings={filteredBookings}
          onOpenBooking={(id) => setSelectedId(id)}
          onViewTimeline={() => setView('timeline')}
        />
      ) : view === 'flow' ? (
        <BookingFlow
          date={date}
          tables={tables}
          bookings={filteredBookings}
          query={query}
          onOpenBooking={(id) => setSelectedId(id)}
        />
      ) : view === 'list' ? (
        <div>
          <div className="flex gap-2 overflow-x-auto border-b border-gray-100 px-3 py-2">
            {([
              ['all', 'All'],
              ['upcoming', 'Upcoming'],
              ['completed', 'Completed'],
              ['cancelled', 'Cancelled'],
              ['notable', 'No table'],
            ] as const).map(([id, label]) => {
              const count = filteredBookings.filter((booking) => {
                const placed = placedBooking(booking);
                if (id === 'upcoming') return placed.status === 'confirmed';
                if (id === 'completed') return placed.status === 'completed';
                if (id === 'cancelled') return placed.status === 'cancelled';
                if (id === 'notable') return !placed.table_id;
                return true;
              }).length;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setListFilter(id)}
                  className={cn(
                    'whitespace-nowrap rounded-full border px-3 py-1 text-xs',
                    listFilter === id ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {label} {count}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-[7.5rem_1fr_4rem_6.5rem_9rem] gap-2 border-b border-gray-100 px-4 py-2 text-xs font-medium text-gray-400">
            <span>Time</span>
            <span>Guest</span>
            <span>Guests</span>
            <span>Table</span>
            <span>Status</span>
          </div>
          {listBookings.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-gray-500">No bookings for this day.</p>
          )}
          <div className="divide-y divide-gray-100">
            {listBookings.map((source) => {
              const booking = placedBooking(source);
              const table = tables.find((item) => item.id === booking.table_id);
              const bookedAt = booking.created_at ? format(new Date(booking.created_at), 'MMM d, HH:mm') : '';
              return (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => setSelectedId(booking.id)}
                  className={cn(
                    'grid w-full grid-cols-[7.5rem_1fr_4rem_6.5rem_9rem] gap-2 px-4 py-3 text-left text-sm hover:bg-gray-50',
                    selectedId === booking.id && 'bg-gray-50'
                  )}
                >
                  <span>
                    <span className="block font-medium text-gray-900">{formatClock(booking.start_time)}–{formatClock(booking.end_time)}</span>
                    {bookedAt && <span className="block text-xs text-gray-400">Booked {bookedAt}</span>}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-gray-900">{booking.customer_name}</span>
                    {booking.special_requests && <span className="block truncate text-xs text-amber-700">{booking.special_requests}</span>}
                  </span>
                  <span className="text-gray-700">{booking.party_size}</span>
                  <span>
                    <span className="block font-medium text-gray-900">{table?.name || '—'}</span>
                    <span className="block text-xs text-gray-400">{table?.section || 'No table'}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-700">
                    <span className={cn('h-1.5 w-1.5 rounded-full', booking.status === 'cancelled' ? 'bg-red-500' : booking.status === 'completed' ? 'bg-gray-400' : 'bg-blue-500')} />
                    {STATUS_LABEL[booking.status] || booking.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : view !== 'timeline' ? (
        <p className="px-4 py-16 text-center text-sm text-gray-500">
          {VIEWS.find((item) => item.id === view)?.label} is not part of core yet. Timeline is the working view.
        </p>
      ) : (
        <div ref={timelineScrollRef} className="overflow-x-auto">
          <div style={{ width: LABEL_WIDTH + gridWidth }} className="relative">
            <div className="sticky top-0 z-20 flex border-b border-gray-100 bg-white">
              <div className="sticky left-0 z-30 flex items-center gap-1 border-r border-gray-100 bg-white px-3" style={{ width: LABEL_WIDTH }}>
                <button
                  type="button"
                  aria-label="Zoom out"
                  onClick={() => setZoomIndex((index) => Math.max(0, index - 1))}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-xs text-gray-500">{ZOOM_STEPS[zoomIndex]}x</span>
                <button
                  type="button"
                  aria-label="Zoom in"
                  onClick={() => setZoomIndex((index) => Math.min(ZOOM_STEPS.length - 1, index + 1))}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="relative h-10" style={{ width: gridWidth }}>
                {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => {
                  const left = index * hourWidth;
                  if (nowVisible && Math.abs(left - nowOffset) < 42) return null;
                  return (
                    <span
                      key={index}
                      className="absolute top-3 text-xs text-gray-400"
                      style={{ left: left + 6 }}
                    >
                      {`${START_HOUR + index}:00`}
                    </span>
                  );
                })}
                {nowVisible && (
                  <span
                    className="absolute top-2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-medium text-white"
                    style={{ left: Math.min(nowOffset + 6, gridWidth - 42) }}
                  >
                    {format(now, 'HH:mm')}
                  </span>
                )}
              </div>
            </div>

            {rows.length === 0 && (
              <p className="px-4 py-12 text-center text-sm text-gray-500">No tables to show for this search.</p>
            )}

            {rows.map((row) => {
              if (row.kind === 'section') {
                return (
                  <div key={`section-${row.name}`} className="flex border-b border-gray-100 bg-gray-50/80">
                    <div className="sticky left-0 z-10 border-r border-gray-100 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500" style={{ width: LABEL_WIDTH }}>
                      {row.name}
                    </div>
                    <div style={{ width: gridWidth }} />
                  </div>
                );
              }

              const tableBookings = filteredBookings.filter((booking) => placedBooking(booking).table_id === row.table.id);
              return (
                <div
                  key={row.table.id}
                  data-table-id={row.table.id}
                  className={cn('flex border-b border-gray-100', drag?.tableId === row.table.id && 'bg-amber-50/70')}
                >
                  <div className="sticky left-0 z-10 border-r border-gray-100 bg-white px-3 py-2" style={{ width: LABEL_WIDTH }}>
                    <p className="text-sm font-medium text-gray-900">{row.table.name}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-400">
                      <Users className="h-3 w-3" />
                      {row.table.capacity}
                    </p>
                  </div>
                  <div className="relative h-14" style={{ width: gridWidth }}>
                    {Array.from({ length: END_HOUR - START_HOUR }, (_, index) => (
                      <span
                        key={index}
                        className="absolute inset-y-0 border-l border-gray-100"
                        style={{ left: index * hourWidth }}
                      />
                    ))}
                    {nowVisible && (
                      <span className="absolute inset-y-0 z-10 w-px bg-rose-500" style={{ left: nowOffset }} />
                    )}
                    {tableBookings.map((source) => {
                      const booking = placedBooking(source);
                      const left = Math.max(0, positionFor(booking.start_time));
                      const right = Math.min(gridWidth, positionFor(booking.end_time));
                      const width = Math.max(right - left, 72);
                      const tone = toneFor(booking, date);
                      const tasting = /tasting/i.test(booking.special_requests || '');
                      const dragging = drag?.id === booking.id;
                      return (
                        <div
                          key={booking.id}
                          className={cn(
                            'absolute top-1.5 bottom-1.5 cursor-grab touch-none overflow-hidden rounded-md border px-2 py-1 active:cursor-grabbing',
                            toneClass[tone],
                            tasting && 'border-t-2 border-t-amber-400',
                            dragging && 'opacity-40'
                          )}
                          style={{ left, width }}
                          title="Drag to another time or table"
                          onPointerDown={(event) => beginDrag(event, source, left, width)}
                          onPointerMove={moveDrag}
                          onPointerUp={endDrag}
                          onPointerCancel={endDrag}
                        >
                          <p className="flex items-center gap-1 truncate text-xs font-medium">
                            {tone === 'seated' && <Check className="h-3 w-3 shrink-0" />}
                            {booking.customer_name}
                          </p>
                          <p className="flex items-center gap-1 truncate text-[11px] opacity-70">
                            <Clock className="h-3 w-3 shrink-0" />
                            {formatClock(booking.start_time)}
                            <Users className="h-3 w-3 shrink-0" />
                            {booking.party_size}
                          </p>
                          {tasting && (
                            <p className="truncate text-[10px] font-medium text-amber-700">Tasting Menu</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
      {selectedBooking && view !== 'requests' && (
        <ReservationEditor
          booking={selectedBooking}
          tables={tables}
          saving={saving}
          onClose={() => setSelectedId(null)}
          onViewTimeline={() => setView('timeline')}
          onSave={async (update) => {
            if (!selectedSource) return;
            setSaving(true);
            setMoveError(null);
            try {
              await onSaveBooking(selectedSource, update);
            } catch (error) {
              setMoveError(actionError(error, 'Could not save that booking.'));
            } finally {
              setSaving(false);
            }
          }}
          onDuplicate={async (update) => {
            if (!selectedSource) return;
            setSaving(true);
            setMoveError(null);
            try {
              const created = await onDuplicateBooking(selectedSource, update);
              const [year, month, day] = created.date.split('-').map(Number);
              onDateChange(new Date(year, month - 1, day));
              setSelectedId(created.id);
            } catch (error) {
              setMoveError(actionError(error, 'Could not duplicate that booking.'));
            } finally {
              setSaving(false);
            }
          }}
          onDelete={async () => {
            if (!selectedSource) return;
            setSaving(true);
            setMoveError(null);
            try {
              await onDeleteBooking(selectedSource);
              setSelectedId(null);
            } catch (error) {
              setMoveError(actionError(error, 'Could not delete that booking.'));
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
      </div>

      {drag && (
        <div
          className="pointer-events-none fixed z-50 overflow-hidden rounded-md border border-neutral-900 bg-white px-2 py-1 shadow-lg"
          style={{ left: drag.x, top: drag.y, width: drag.width }}
        >
          <p className="truncate text-xs font-medium text-gray-900">{drag.name}</p>
          <p className="truncate text-[11px] text-gray-500">{drag.timeLabel} · {drag.party}</p>
        </div>
      )}
    </section>
  );
};

export default BookingTimeline;

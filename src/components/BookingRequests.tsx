import React, { useMemo, useState } from 'react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { AlertTriangle, Calendar, Check, Clock, Info, List, Minus, Plus, SlidersHorizontal, X } from 'lucide-react';
import type { Booking, Table as DiningTable } from '@/services/supabaseBookingService';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'tp-core.booking-requests';

export type RequestKind = 'request' | 'waitlist';

export interface BookingRequest {
  id: string;
  kind: RequestKind;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  party_size: number;
  booking_date: string;
  start_time: string;
  window_minutes: number;
  duration_minutes: number;
  notes?: string;
  restaurant_id?: string;
  created_at: string;
  status: 'open' | 'dismissed' | 'accepted';
}

export const loadBookingRequests = (): BookingRequest[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveBookingRequests = (requests: BookingRequest[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
};

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

const minutesToClock = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export const isRequestExpired = (request: BookingRequest, now = new Date()) => {
  const latest = toMinutes(request.start_time) + request.window_minutes;
  const [year, month, day] = request.booking_date.split('-').map(Number);
  const when = new Date(year, month - 1, day, Math.floor(latest / 60), latest % 60);
  return when.getTime() < now.getTime();
};

const agoLabel = (iso: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

const dayLabel = (date: string) => {
  const parsed = parseISO(date);
  if (isToday(parsed)) return 'Today';
  if (isTomorrow(parsed)) return 'Tomorrow';
  return format(parsed, 'EEE, MMM d');
};

const overlaps = (start: number, end: number, otherStart: number, otherEnd: number) => start < otherEnd && end > otherStart;

export const suggestSlot = (
  request: BookingRequest,
  tables: DiningTable[],
  bookings: Booking[]
): { time: string; table: DiningTable } | null => {
  const preferred = toMinutes(request.start_time);
  const duration = request.duration_minutes || 90;
  const dayBookings = bookings.filter(
    (booking) => booking.booking_date === request.booking_date && booking.status !== 'cancelled' && booking.table_id
  );
  const fitting = tables
    .filter((table) => table.capacity >= request.party_size)
    .sort((a, b) => a.capacity - b.capacity || a.name.localeCompare(b.name, undefined, { numeric: true }));

  let best: { time: number; table: DiningTable; distance: number } | null = null;
  for (let time = preferred - request.window_minutes; time <= preferred + request.window_minutes; time += 15) {
    if (time < 11 * 60 || time + duration > 23 * 60) continue;
    const table = fitting.find((candidate) =>
      !dayBookings.some((booking) =>
        booking.table_id === candidate.id &&
        overlaps(time, time + duration, toMinutes(booking.start_time), toMinutes(booking.end_time))
      )
    );
    if (!table) continue;
    const distance = Math.abs(time - preferred);
    if (!best || distance < best.distance || (distance === best.distance && time < best.time)) {
      best = { time, table, distance };
    }
  }
  return best ? { time: minutesToClock(best.time), table: best.table } : null;
};

interface BookingRequestsProps {
  requests: BookingRequest[];
  onChange: (requests: BookingRequest[]) => void;
  tables: DiningTable[];
  bookings: Booking[];
  selectedRestaurantId: string;
  query: string;
  onAccept: (request: BookingRequest, slot: { time: string; table: DiningTable }) => Promise<void>;
}

const emptyDraft = (kind: RequestKind, restaurantId: string) => ({
  kind,
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  party_size: 2,
  booking_date: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'),
  start_time: '18:00',
  window_minutes: kind === 'waitlist' ? 90 : 0,
  duration_minutes: 90,
  notes: '',
  restaurant_id: restaurantId,
});

const BookingRequests = ({
  requests,
  onChange,
  tables,
  bookings,
  selectedRestaurantId,
  query,
  onAccept,
}: BookingRequestsProps) => {
  const [showExpired, setShowExpired] = useState(false);
  const [density, setDensity] = useState<'compact' | 'detailed'>('compact');
  const [month, setMonth] = useState('all');
  const [kind, setKind] = useState<'all' | RequestKind>('all');
  const [draft, setDraft] = useState<ReturnType<typeof emptyDraft> | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scoped = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return requests.filter((request) => {
      if (request.status !== 'open') return false;
      if (selectedRestaurantId && request.restaurant_id && request.restaurant_id !== selectedRestaurantId) return false;
      if (!showExpired && isRequestExpired(request)) return false;
      if (!needle) return true;
      return (
        request.customer_name.toLowerCase().includes(needle) ||
        request.customer_email.toLowerCase().includes(needle) ||
        request.customer_phone?.toLowerCase().includes(needle) ||
        request.notes?.toLowerCase().includes(needle)
      );
    });
  }, [requests, query, selectedRestaurantId, showExpired]);

  const months = useMemo(() => {
    const keys = Array.from(new Set(scoped.map((request) => request.booking_date.slice(0, 7)))).sort();
    return keys;
  }, [scoped]);

  const monthScoped = scoped.filter((request) => month === 'all' || request.booking_date.startsWith(month));
  const visible = monthScoped.filter((request) => kind === 'all' || request.kind === kind);
  const requestCount = monthScoped.filter((request) => request.kind === 'request').length;
  const waitlistCount = monthScoped.filter((request) => request.kind === 'waitlist').length;
  const laterMonths = month !== 'all' && scoped.some((request) => !request.booking_date.startsWith(month));

  const groups = useMemo(() => {
    const map = new Map<string, BookingRequest[]>();
    visible
      .slice()
      .sort((a, b) => a.booking_date.localeCompare(b.booking_date) || a.start_time.localeCompare(b.start_time))
      .forEach((request) => {
        const list = map.get(request.booking_date) || [];
        list.push(request);
        map.set(request.booking_date, list);
      });
    return Array.from(map.entries());
  }, [visible]);

  const updateRequest = (id: string, patch: Partial<BookingRequest>) => {
    onChange(requests.map((request) => (request.id === id ? { ...request, ...patch } : request)));
  };

  const saveDraft = () => {
    if (!draft || !draft.customer_name.trim() || !draft.customer_email.trim()) return;
    const next: BookingRequest = {
      id: crypto.randomUUID(),
      kind: draft.kind,
      customer_name: draft.customer_name.trim(),
      customer_email: draft.customer_email.trim(),
      customer_phone: draft.customer_phone.trim(),
      party_size: draft.party_size,
      booking_date: draft.booking_date,
      start_time: draft.start_time.slice(0, 5),
      window_minutes: draft.kind === 'request' ? 0 : draft.window_minutes,
      duration_minutes: draft.duration_minutes,
      notes: draft.notes.trim(),
      restaurant_id: draft.restaurant_id || undefined,
      created_at: new Date().toISOString(),
      status: 'open',
    };
    onChange([next, ...requests]);
    setDraft(null);
    setMonth('all');
    setKind('all');
  };

  return (
    <div className="px-3 py-3">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Show expired
          <button
            type="button"
            role="switch"
            aria-checked={showExpired}
            onClick={() => setShowExpired((value) => !value)}
            className={cn('relative h-5 w-9 rounded-full transition', showExpired ? 'bg-emerald-800' : 'bg-gray-200')}
          >
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition', showExpired ? 'left-4' : 'left-0.5')} />
          </button>
        </label>
        <div className="ml-auto flex rounded-lg border border-gray-200 p-0.5">
          {(['compact', 'detailed'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDensity(value)}
              className={cn(
                'rounded-md px-3 py-1 text-sm capitalize',
                density === value ? 'bg-emerald-800 text-white' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <MonthChip label="All" count={scoped.length} active={month === 'all'} onClick={() => setMonth('all')} />
        {months.map((key) => (
          <MonthChip
            key={key}
            label={format(parseISO(`${key}-01`), 'MMM yyyy')}
            count={scoped.filter((request) => request.booking_date.startsWith(key)).length}
            active={month === key}
            onClick={() => setMonth(key)}
          />
        ))}
        {!laterMonths && (
          <span className="inline-flex items-center gap-1 text-sm text-gray-400">
            <Info className="h-3.5 w-3.5" />
            No more requests
          </span>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {([
          ['all', 'All', monthScoped.length],
          ['request', 'Requests', requestCount],
          ['waitlist', 'Waitlist', waitlistCount],
        ] as const).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm',
              kind === id ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            )}
          >
            {label}
            <span className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs', kind === id ? 'bg-white/20' : 'bg-gray-100')}>
              {count}
            </span>
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          {(kind === 'all' || kind === 'request') && (
            <button
              type="button"
              onClick={() => setDraft(emptyDraft('request', selectedRestaurantId))}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add booking request
            </button>
          )}
          {(kind === 'all' || kind === 'waitlist') && (
            <button
              type="button"
              onClick={() => setDraft(emptyDraft('waitlist', selectedRestaurantId))}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add to waitlist
            </button>
          )}
        </div>
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {draft && (
        <form
          className="mb-3 grid gap-3 rounded-xl border border-gray-200 p-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            saveDraft();
          }}
        >
          <p className="sm:col-span-2 text-sm font-medium text-gray-900">
            {draft.kind === 'waitlist' ? 'New waitlist entry' : 'New booking request'}
          </p>
          <label className="text-xs text-gray-500">
            Guest
            <input required value={draft.customer_name} onChange={(event) => setDraft({ ...draft, customer_name: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
          </label>
          <label className="text-xs text-gray-500">
            Email
            <input required type="email" value={draft.customer_email} onChange={(event) => setDraft({ ...draft, customer_email: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
          </label>
          <label className="text-xs text-gray-500">
            Phone
            <input value={draft.customer_phone} onChange={(event) => setDraft({ ...draft, customer_phone: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
          </label>
          <label className="text-xs text-gray-500">
            Date
            <input required type="date" value={draft.booking_date} onChange={(event) => setDraft({ ...draft, booking_date: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
          </label>
          <label className="text-xs text-gray-500">
            Time
            <input required type="time" step={900} value={draft.start_time} onChange={(event) => setDraft({ ...draft, start_time: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Stepper label="Guests" value={draft.party_size} min={1} max={20} step={1} onChange={(party_size) => setDraft({ ...draft, party_size })} />
            <Stepper label="Duration" value={draft.duration_minutes} min={30} max={240} step={15} suffix="m" onChange={(duration_minutes) => setDraft({ ...draft, duration_minutes })} />
          </div>
          {draft.kind === 'waitlist' && (
            <label className="text-xs text-gray-500">
              Flexibility
              <select value={draft.window_minutes} onChange={(event) => setDraft({ ...draft, window_minutes: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900">
                {[15, 30, 60, 90, 120].map((minutes) => (
                  <option key={minutes} value={minutes}>±{minutes}min</option>
                ))}
              </select>
            </label>
          )}
          <label className="text-xs text-gray-500 sm:col-span-2">
            Staff notes
            <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={() => setDraft(null)} className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-emerald-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-900">Save</button>
          </div>
        </form>
      )}

      {groups.length === 0 && (
        <p className="px-2 py-12 text-center text-sm text-gray-500">No requests for this filter.</p>
      )}

      <div className="space-y-3">
        {groups.map(([date, items]) => (
          <section key={date} className="rounded-xl border border-gray-200">
            <header className="flex items-center gap-2 px-4 py-3">
              <h3 className="text-base font-semibold text-gray-900">{dayLabel(date)}</h3>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-xs text-gray-600">{items.length}</span>
            </header>
            <div className="space-y-2 px-3 pb-3">
              {items.map((request) => {
                const slot = suggestSlot(request, tables, bookings);
                const adjusting = adjustingId === request.id;
                return (
                  <article key={request.id} className="overflow-hidden rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {request.start_time}
                        {request.window_minutes > 0 ? ` ±${request.window_minutes}min` : ''}
                      </span>
                      <span className="ml-auto inline-flex items-center gap-1 text-gray-500">
                        {request.kind === 'waitlist' ? <List className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                        {request.kind === 'waitlist' ? 'Waitlist' : 'Request'}
                        <Clock className="ml-2 h-3.5 w-3.5" />
                        {agoLabel(request.created_at)}
                      </span>
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {request.customer_name} <span className="font-medium text-gray-600">{request.party_size} guests</span>
                      </p>
                      {density === 'detailed' && (
                        <p className="mt-1 text-xs text-gray-500">
                          {[request.customer_phone, request.customer_email, request.notes].filter(Boolean).join(' · ') || 'No contact details'}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
                      {slot ? (
                        <button
                          type="button"
                          disabled={acceptingId === request.id}
                          onClick={async () => {
                            setAcceptingId(request.id);
                            setError(null);
                            try {
                              await onAccept(request, slot);
                              updateRequest(request.id, { status: 'accepted' });
                            } catch (caught) {
                              setError(caught instanceof Error ? caught.message : 'Could not accept that request.');
                            } finally {
                              setAcceptingId(null);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Accept {slot.time} at {slot.table.name}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-500">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          No availability
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setAdjustingId(adjusting ? null : request.id)}
                        className="ml-auto inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Adjust
                      </button>
                      <button
                        type="button"
                        aria-label={`Dismiss ${request.customer_name}`}
                        onClick={() => updateRequest(request.id, { status: 'dismissed' })}
                        className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {adjusting && (
                      <AdjustForm
                        request={request}
                        onCancel={() => setAdjustingId(null)}
                        onSave={(patch) => {
                          updateRequest(request.id, patch);
                          setAdjustingId(null);
                        }}
                      />
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

const MonthChip = ({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn('min-w-16 rounded-lg px-3 py-1.5 text-center', active ? 'bg-emerald-800 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50')}
  >
    <span className="block text-xs font-medium">{label}</span>
    <span className="block text-sm font-semibold">{count}</span>
  </button>
);

const Stepper = ({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) => (
  <div>
    <p className="mb-1 text-xs text-gray-500">{label}</p>
    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-2 py-1">
      <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(min, value - step))} className="rounded-full p-1 hover:bg-gray-100"><Minus className="h-3.5 w-3.5" /></button>
      <span className="text-sm font-medium">{value}{suffix}</span>
      <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(Math.min(max, value + step))} className="rounded-full p-1 hover:bg-gray-100"><Plus className="h-3.5 w-3.5" /></button>
    </div>
  </div>
);

const AdjustForm = ({
  request,
  onCancel,
  onSave,
}: {
  request: BookingRequest;
  onCancel: () => void;
  onSave: (patch: Partial<BookingRequest>) => void;
}) => {
  const [party, setParty] = useState(request.party_size);
  const [duration, setDuration] = useState(request.duration_minutes);
  const [windowMinutes, setWindowMinutes] = useState(request.window_minutes);
  const [date, setDate] = useState(request.booking_date);
  const [time, setTime] = useState(request.start_time);
  const [phone, setPhone] = useState(request.customer_phone || '');
  const [email, setEmail] = useState(request.customer_email);
  const [notes, setNotes] = useState(request.notes || '');

  return (
    <form
      className="grid gap-3 border-t border-gray-100 p-3 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          party_size: party,
          duration_minutes: duration,
          window_minutes: request.kind === 'request' ? 0 : windowMinutes,
          booking_date: date,
          start_time: time.slice(0, 5),
          customer_phone: phone.trim(),
          customer_email: email.trim(),
          notes: notes.trim(),
        });
      }}
    >
      <label className="text-xs text-gray-500">
        Date
        <input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
      </label>
      <label className="text-xs text-gray-500">
        Time
        <input required type="time" step={900} value={time} onChange={(event) => setTime(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
      </label>
      <Stepper label="Guests" value={party} min={1} max={20} step={1} onChange={setParty} />
      <Stepper label="Duration" value={duration} min={30} max={240} step={15} suffix="m" onChange={setDuration} />
      {request.kind === 'waitlist' && (
        <label className="text-xs text-gray-500">
          Flexibility
          <select value={windowMinutes} onChange={(event) => setWindowMinutes(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900">
            {[15, 30, 60, 90, 120].map((minutes) => (
              <option key={minutes} value={minutes}>±{minutes}min</option>
            ))}
          </select>
        </label>
      )}
      <label className="text-xs text-gray-500">
        Phone
        <input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
      </label>
      <label className="text-xs text-gray-500 sm:col-span-2">
        Email
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
      </label>
      <label className="text-xs text-gray-500 sm:col-span-2">
        Staff notes
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
      </label>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <button type="submit" className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white">Save</button>
      </div>
    </form>
  );
};

export default BookingRequests;

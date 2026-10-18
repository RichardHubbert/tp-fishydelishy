import React, { useEffect, useMemo, useState } from 'react';
import { isSameDay } from 'date-fns';
import { Armchair, ChevronDown, Clock, Plus, StickyNote, UserCheck, Users } from 'lucide-react';
import type { Booking, Table as DiningTable } from '@/services/supabaseBookingService';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'tp-core.booking-flow';
type Stage = 'upcoming' | 'arrived' | 'seated';

const loadStages = (): Record<string, Exclude<Stage, 'upcoming'>> => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

const formatClock = (time: string) => time.slice(0, 5);

const agoLabel = (iso?: string) => {
  if (!iso) return '';
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'less than a minute ago';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

const arrivalLabel = (booking: Booking, date: Date) => {
  const now = new Date();
  if (!isSameDay(date, now)) return formatClock(booking.start_time);
  const diff = toMinutes(booking.start_time) - (now.getHours() * 60 + now.getMinutes());
  if (Math.abs(diff) <= 1) return 'Expected now';
  if (diff < 0) {
    const ago = -diff;
    return ago < 60 ? `Expected ${ago} min ago` : `Expected ${Math.floor(ago / 60)}h ${ago % 60}m ago`;
  }
  if (diff < 60) return `Arriving in ${diff} min`;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return mins ? `Arriving in ${hours}h ${mins}m` : `Arriving in ${hours}h`;
};

interface BookingFlowProps {
  date: Date;
  tables: DiningTable[];
  bookings: Booking[];
  query: string;
  onOpenBooking: (bookingId: string) => void;
}

const BookingFlow = ({ date, tables, bookings, query, onOpenBooking }: BookingFlowProps) => {
  const [density, setDensity] = useState<'compact' | 'detailed'>('compact');
  const [stages, setStages] = useState(loadStages);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [dragOver, setDragOver] = useState<Stage | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stages));
  }, [stages]);

  const setStage = (id: string, stage: Stage) => {
    setStages((current) => {
      const next = { ...current };
      if (stage === 'upcoming') delete next[id];
      else next[id] = stage;
      return next;
    });
  };

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (booking.status === 'cancelled' || booking.status === 'completed') return false;
      if (!needle) return true;
      return (
        booking.customer_name.toLowerCase().includes(needle) ||
        booking.customer_email?.toLowerCase().includes(needle) ||
        booking.customer_phone?.toLowerCase().includes(needle)
      );
    });
  }, [bookings, query]);

  const stageOf = (booking: Booking): Stage => stages[booking.id] || 'upcoming';
  const upcoming = visible.filter((booking) => stageOf(booking) === 'upcoming').sort((a, b) => a.start_time.localeCompare(b.start_time));
  const arrived = visible.filter((booking) => stageOf(booking) === 'arrived').sort((a, b) => a.start_time.localeCompare(b.start_time));
  const seated = visible.filter((booking) => stageOf(booking) === 'seated').sort((a, b) => a.start_time.localeCompare(b.start_time));

  const shownUpcoming = showAllUpcoming ? upcoming : upcoming.slice(0, 5);
  const hiddenCount = upcoming.length - shownUpcoming.length;
  const groups = shownUpcoming.reduce<{ label: string; items: Booking[] }[]>((list, booking) => {
    const label = arrivalLabel(booking, date);
    const last = list[list.length - 1];
    if (last?.label === label) last.items.push(booking);
    else list.push({ label, items: [booking] });
    return list;
  }, []);

  const activity = visible
    .slice()
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 6);

  const card = (booking: Booking, stage: Stage) => {
    const table = tables.find((item) => item.id === booking.table_id);
    const open = openId === booking.id;
    const next: Stage = stage === 'upcoming' ? 'arrived' : stage === 'arrived' ? 'seated' : 'upcoming';
    const action = stage === 'upcoming' ? 'Mark arrived' : stage === 'arrived' ? 'Show to table' : 'Return to upcoming';
    return (
      <article
        key={booking.id}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData('text/plain', booking.id);
          event.dataTransfer.effectAllowed = 'move';
        }}
        className={cn('rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm', open && 'border-violet-300')}
      >
        <div className="flex items-start gap-2">
          <button type="button" aria-label={open ? 'Collapse booking' : 'Expand booking'} onClick={() => setOpenId(open ? null : booking.id)} className="mt-0.5 text-gray-400">
            <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
          </button>
          <button type="button" onClick={() => onOpenBooking(booking.id)} className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-semibold text-gray-900">{booking.customer_name}</span>
          </button>
          <span className="text-sm text-gray-500">{formatClock(booking.start_time)}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-6">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <Users className="h-3 w-3" />
            {booking.party_size}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            {table?.name || 'No table'}
          </span>
          {booking.special_requests && (
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 px-1.5 py-0.5 text-[11px] text-violet-700">
              <StickyNote className="h-3 w-3" />
              Guest note
            </span>
          )}
        </div>
        {(open || density === 'detailed') && (
          <div className="mt-2 space-y-2 border-t border-gray-100 pt-2 pl-6">
            {density === 'detailed' && (
              <p className="text-xs text-gray-500">
                {[booking.customer_phone, booking.customer_email, booking.special_requests].filter(Boolean).join(' · ') || 'No extra details'}
              </p>
            )}
            {open && booking.special_requests && density === 'compact' && (
              <p className="text-xs text-gray-600">{booking.special_requests}</p>
            )}
            <button type="button" onClick={() => setStage(booking.id, next)} className="text-xs font-medium text-emerald-800 hover:underline">
              {action}
            </button>
          </div>
        )}
      </article>
    );
  };

  const column = (stage: Stage, title: string, icon: React.ReactNode, items: Booking[], empty: string) => (
    <section
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(stage);
      }}
      onDragLeave={() => setDragOver((current) => (current === stage ? null : current))}
      onDrop={(event) => {
        event.preventDefault();
        const id = event.dataTransfer.getData('text/plain');
        if (id) setStage(id, stage);
        setDragOver(null);
      }}
      className={cn('flex min-h-64 flex-col rounded-xl p-3', stage === 'upcoming' ? 'bg-white' : 'bg-gray-50', dragOver === stage && 'ring-2 ring-emerald-700')}
    >
      <header className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800">
        {icon}
        {title}
        <span className="text-gray-400">({items.length})</span>
      </header>
      {items.length === 0 ? (
        <p className="px-2 py-8 text-center text-sm text-gray-400">{empty}</p>
      ) : stage === 'upcoming' ? (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 text-xs text-gray-400">{group.label}</p>
              <div className="space-y-2">{group.items.map((booking) => card(booking, 'upcoming'))}</div>
            </div>
          ))}
          {hiddenCount > 0 && (
            <button type="button" onClick={() => setShowAllUpcoming(true)} className="w-full text-center text-sm text-gray-500 hover:text-gray-800">
              Show {hiddenCount} more
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">{items.map((booking) => card(booking, stage))}</div>
      )}
    </section>
  );

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex justify-end">
        <div className="flex rounded-lg border border-gray-200 p-0.5">
          {(['compact', 'detailed'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDensity(value)}
              className={cn('rounded-md px-3 py-1 text-sm capitalize', density === value ? 'bg-emerald-800 text-white' : 'text-gray-600 hover:bg-gray-50')}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-gray-200 p-3 lg:grid-cols-3">
        {column('upcoming', 'Upcoming', <Clock className="h-4 w-4" />, upcoming, 'No guests are due.')}
        {column('arrived', 'Arrived', <UserCheck className="h-4 w-4" />, arrived, "No guests waiting to be seated. They'll show up here when you mark them as arrived.")}
        {column('seated', 'Seated', <Armchair className="h-4 w-4" />, seated, "No guests are seated right now. They'll appear here once they're shown to their table.")}
      </div>

      <section className="rounded-xl border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        {activity.length === 0 && <p className="mt-3 text-sm text-gray-500">No bookings for this day.</p>}
        <ul className="mt-3 space-y-3">
          {activity.map((booking) => (
            <li key={booking.id} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <Plus className="h-3.5 w-3.5" />
              </span>
              <span>
                <span className="block text-sm text-gray-800">
                  {booking.customer_name} – New booking ({booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'} at {formatClock(booking.start_time)})
                </span>
                {booking.created_at && <span className="block text-xs text-gray-400">{agoLabel(booking.created_at)}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default BookingFlow;

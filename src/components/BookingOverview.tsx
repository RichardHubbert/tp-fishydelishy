import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { isSameDay } from 'date-fns';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { ChevronRight, ClipboardList, Users } from 'lucide-react';
import type { Booking, Table as DiningTable } from '@/services/supabaseBookingService';
import { cn } from '@/lib/utils';

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

const formatClock = (time: string) => time.slice(0, 5);

const hourLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${String(mins).padStart(2, '0')}`;
};

const GuestFlowChart = ({ data }: { data: { time: string; guests: number }[] }) => {
  const host = useRef<HTMLDivElement>(null);
  const dataKey = JSON.stringify(data);

  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const points = JSON.parse(dataKey) as { time: string; guests: number }[];
    const root = am5.Root.new(element);
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: 'none',
      wheelY: 'none',
      paddingLeft: 0,
      paddingRight: 8,
      paddingTop: 8,
      paddingBottom: 16,
    }));

    const xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 48 });
    xRenderer.labels.template.setAll({ fontSize: 10, fill: am5.color(0x9ca3af), paddingTop: 8 });
    xRenderer.grid.template.set('strokeOpacity', 0);

    const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: 'time',
      renderer: xRenderer,
    }));
    xAxis.data.setAll(points);

    const yRenderer = am5xy.AxisRendererY.new(root, {});
    yRenderer.labels.template.setAll({ fontSize: 10, fill: am5.color(0x9ca3af) });
    yRenderer.grid.template.setAll({ stroke: am5.color(0xe5e7eb), strokeOpacity: 1 });

    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      min: 0,
      maxPrecision: 0,
      extraMax: 0.15,
      renderer: yRenderer,
    }));

    const series = chart.series.push(am5xy.ColumnSeries.new(root, {
      xAxis,
      yAxis,
      valueYField: 'guests',
      categoryXField: 'time',
      tooltip: am5.Tooltip.new(root, { labelText: '{categoryX}: {valueY} guests' }),
    }));
    series.columns.template.setAll({
      fill: am5.color(0x065f46),
      strokeOpacity: 0,
      width: am5.percent(62),
      cornerRadiusTL: 1,
      cornerRadiusTR: 1,
    });
    series.data.setAll(points);

    return () => root.dispose();
  }, [dataKey]);

  return <div ref={host} className="mt-2 h-52 w-full" />;
};

interface BookingOverviewProps {
  date: Date;
  tables: DiningTable[];
  bookings: Booking[];
  onOpenBooking: (bookingId: string) => void;
  onViewTimeline: () => void;
}

const BookingOverview = ({ date, tables, bookings, onOpenBooking, onViewTimeline }: BookingOverviewProps) => {
  const [density, setDensity] = useState<'compact' | 'detailed'>('compact');
  const active = bookings.filter((booking) => booking.status !== 'cancelled');
  const guests = active.reduce((sum, booking) => sum + booking.party_size, 0);
  const now = new Date();
  const today = isSameDay(date, now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const started = active.filter((booking) => {
    if (date < now && !today) return true;
    if (!today) return false;
    return nowMinutes >= toMinutes(booking.start_time);
  }).length;

  const flow = useMemo(() => {
    const slots = Array.from({ length: ((22 * 60) - (11 * 60)) / 30 + 1 }, (_, index) => {
      const minutes = 11 * 60 + index * 30;
      const guestsHere = active.reduce((sum, booking) => {
        const start = toMinutes(booking.start_time);
        const end = toMinutes(booking.end_time);
        return minutes >= start && minutes < end ? sum + booking.party_size : sum;
      }, 0);
      return { time: hourLabel(minutes), guests: guestsHere };
    });
    const first = slots.findIndex((slot) => slot.guests > 0);
    const last = slots.reduce((found, slot, index) => (slot.guests > 0 ? index : found), -1);
    if (first === -1) return slots.filter((_, index) => index % 2 === 0).slice(0, 8);
    return slots.slice(Math.max(0, first - 1), Math.min(slots.length, last + 2));
  }, [active]);

  const pinboard = useMemo(() => {
    const groups = new Map<string, Booking[]>();
    active.forEach((booking) => {
      const key = booking.customer_name.trim().toLowerCase();
      const list = groups.get(key) || [];
      list.push(booking);
      groups.set(key, list);
    });
    return Array.from(groups.values())
      .map((items) => items.slice().sort((a, b) => a.start_time.localeCompare(b.start_time)))
      .sort((a, b) => a[0].start_time.localeCompare(b[0].start_time));
  }, [active]);

  const occupiedIds = new Set(active.map((booking) => booking.table_id).filter(Boolean));

  const capacities = Array.from(new Set(tables.map((table) => table.capacity))).sort((a, b) => a - b);

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex justify-end">
        <div className="flex rounded-lg border border-gray-200 p-0.5">
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

      <div className="grid gap-3 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-xl border border-gray-200 p-4">
          <p className="flex items-center gap-2 text-gray-500">
            <Users className="h-4 w-4" />
            <span className="text-3xl font-semibold text-gray-900">{guests}</span>
            <span className="text-sm">guests expected</span>
          </p>
          <p className="mt-4 border-t border-gray-100 pt-3 text-sm text-gray-700">
            {active.length} {active.length === 1 ? 'reservation' : 'reservations'}
          </p>
        </section>

        <section className="rounded-xl border border-gray-200 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800 text-white">
              <ClipboardList className="h-4 w-4" />
            </span>
            {active.length} {active.length === 1 ? 'booking' : 'bookings'}
          </p>
          <div className="mt-3 space-y-1 text-sm text-gray-600">
            <p>{active.filter((booking) => booking.status === 'confirmed').length} confirmed</p>
            <p>{active.filter((booking) => booking.status === 'completed').length} completed</p>
            <p>{Math.max(active.length - started, 0)} still to arrive</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-emerald-800"
              style={{ width: active.length ? `${(started / active.length) * 100}%` : '0%' }}
            />
          </div>
          <p className="mt-3 text-sm text-amber-800">
            {active.length === 0
              ? 'No bookings for this day.'
              : today
                ? `${started} of ${active.length} ${active.length === 1 ? 'booking has' : 'bookings have'} started`
                : date < now
                  ? 'This day has passed'
                  : 'These bookings are still ahead'}
          </p>
          <button type="button" onClick={onViewTimeline} className="mt-3 text-sm text-gray-500 hover:text-gray-800">
            View in timeline →
          </button>
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900">Guest Flow</h3>
          <GuestFlowChart data={flow} />
          <button type="button" onClick={onViewTimeline} className="mt-3 block w-full text-right text-sm text-gray-400 hover:text-gray-700">
            View in timeline →
          </button>
        </section>

        <section className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900">Pinboard</h3>
          {pinboard.length === 0 && <p className="mt-4 text-sm text-gray-500">No bookings for this day.</p>}
          <div className="mt-3 space-y-2">
            {pinboard.map((items) => {
              const first = items[0];
              const times = items.map((booking) => `${formatClock(booking.start_time)}–${formatClock(booking.end_time)}`).join(', ');
              const notes = items.map((booking) => booking.special_requests).filter(Boolean).join(' · ');
              return (
                <button
                  key={first.id}
                  type="button"
                  onClick={() => onOpenBooking(first.id)}
                  className="flex w-full items-center gap-3 rounded-lg bg-amber-50 px-3 py-2.5 text-left hover:bg-amber-100"
                >
                  <ClipboardList className="h-4 w-4 shrink-0 text-gray-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900">{first.customer_name}</span>
                    <span className="block truncate text-xs text-gray-500">
                      {items.length} {items.length === 1 ? 'booking' : 'bookings'} today · {times}
                    </span>
                    {density === 'detailed' && (
                      <span className="block truncate text-xs text-gray-400">
                        {[first.customer_email, first.customer_phone, notes].filter(Boolean).join(' · ') || 'No extra details'}
                      </span>
                    )}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-gray-900">Available Tables</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {capacities.map((capacity) => {
            const matching = tables.filter((table) => table.capacity === capacity);
            const free = matching.filter((table) => !occupiedIds.has(table.id));
            return (
              <div key={capacity} className="rounded-xl bg-gray-100 px-4 py-5 text-center">
                <Users className="mx-auto h-4 w-4 text-gray-500" />
                <p className="mt-1 text-3xl font-semibold text-gray-900">{free.length}</p>
                <p className="text-sm text-gray-500">For {capacity}</p>
                {density === 'detailed' && (
                  <p className="mt-2 text-xs text-gray-400">{free.map((table) => table.name).join(', ') || 'None free'}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default BookingOverview;

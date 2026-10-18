import React, { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Heart, Clock, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchTables, fetchAllBookings, type Table, type Booking } from '@/services/supabaseBookingService';
import { fetchRestaurants, Restaurant } from '@/services/restaurantService';

interface TimeSlot {
  hour: number;
  label: string;
}

interface TableGroup {
  name: string;
  tables: Table[];
}

const TimelineView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tables, setTables] = useState<Table[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [selectedView, setSelectedView] = useState<string>('timeline');
  const [loading, setLoading] = useState(true);

  // Time configuration
  const startHour = 17; // 5 PM
  const endHour = 23; // 11 PM
  const timeSlots: TimeSlot[] = [];
  
  for (let hour = startHour; hour <= endHour; hour++) {
    timeSlots.push({
      hour,
      label: `${hour}:00`
    });
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [tablesData, bookingsData, restaurantsData] = await Promise.all([
          fetchTables(),
          fetchAllBookings(),
          fetchRestaurants()
        ]);
        setTables(tablesData);
        setBookings(bookingsData);
        setRestaurants(restaurantsData);
      } catch (error) {
        console.error('Error loading timeline data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Group tables by section
  const tableGroups: TableGroup[] = [
    {
      name: 'Dining Room',
      tables: tables.filter(t => t.section.toLowerCase().includes('dining') || t.section.toLowerCase().includes('main'))
    },
    {
      name: 'Bar & Lounge',
      tables: tables.filter(t => t.section.toLowerCase().includes('bar') || t.section.toLowerCase().includes('lounge'))
    }
  ];

  // Filter bookings for selected date
  const dayBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.booking_date);
    return format(bookingDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  });

  // Get bookings for a specific table
  const getTableBookings = (tableId: string) => {
    return dayBookings.filter(b => b.table_id === tableId);
  };

  // Calculate booking position and width
  const calculateBookingStyle = (booking: Booking) => {
    const [startHourStr, startMinuteStr] = booking.start_time.split(':');
    const [endHourStr, endMinuteStr] = booking.end_time.split(':');
    
    const startHour = parseInt(startHourStr);
    const startMinute = parseInt(startMinuteStr);
    const endHour = parseInt(endHourStr);
    const endMinute = parseInt(endMinuteStr);

    // Calculate position from start of timeline (17:00)
    const startOffset = (startHour - 17) + (startMinute / 60);
    const duration = (endHour - startHour) + ((endMinute - startMinute) / 60);

    // Each hour takes up ~14.28% of the width (7 hours total: 17-24)
    const hourWidth = 100 / 7;
    const left = startOffset * hourWidth;
    const width = duration * hourWidth;

    return {
      left: `${left}%`,
      width: `${width}%`
    };
  };

  // Get color for booking
  const getBookingColor = (booking: Booking) => {
    const colors = [
      'bg-blue-200 border-blue-300 text-blue-900',
      'bg-green-200 border-green-300 text-green-900',
      'bg-purple-200 border-purple-300 text-purple-900',
      'bg-pink-200 border-pink-300 text-pink-900',
      'bg-amber-200 border-amber-300 text-amber-900',
      'bg-cyan-200 border-cyan-300 text-cyan-900',
    ];
    // Use table_id to consistently color bookings for the same table
    const hash = booking.table_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handlePrevDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <span className="ml-3 text-gray-600">Loading timeline...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevDay}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="px-3 h-8"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextDay}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="font-semibold text-lg">
              {format(selectedDate, 'EEEE, MMMM d')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* View tabs */}
          <Tabs value={selectedView} onValueChange={setSelectedView}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="flow">Flow</TabsTrigger>
              <TabsTrigger value="floor">Floor Plan</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="text-sm font-medium text-gray-700">
            <span className="text-gray-500">18:10</span>
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <Card className="overflow-hidden">
        <div className="bg-white">
          {/* Time header */}
          <div className="flex border-b bg-gray-50">
            <div className="w-32 flex-shrink-0 border-r"></div>
            <div className="flex-1 flex">
              {timeSlots.map((slot) => (
                <div
                  key={slot.hour}
                  className="flex-1 text-center py-2 text-sm font-medium text-gray-600 border-r last:border-r-0"
                >
                  {slot.label}
                </div>
              ))}
            </div>
          </div>

          {/* Table groups and rows */}
          {tableGroups.map((group, groupIndex) => (
            <div key={group.name}>
              {/* Group header */}
              <div className="bg-gray-100 border-b">
                <div className="px-4 py-2 font-semibold text-sm text-gray-700">
                  {group.name}
                </div>
              </div>

              {/* Table rows */}
              {group.tables.map((table) => {
                const tableBookings = getTableBookings(table.id);
                
                return (
                  <div key={table.id} className="flex border-b hover:bg-gray-50 transition-colors">
                    {/* Table info */}
                    <div className="w-32 flex-shrink-0 border-r px-3 py-3">
                      <div className="font-medium text-sm">{table.name}</div>
                      <div className="text-xs text-gray-500">
                        {table.capacity} seats
                      </div>
                    </div>

                    {/* Timeline area */}
                    <div className="flex-1 relative h-16">
                      {/* Time grid lines */}
                      <div className="absolute inset-0 flex">
                        {timeSlots.map((slot, index) => (
                          <div
                            key={slot.hour}
                            className="flex-1 border-r last:border-r-0"
                          />
                        ))}
                      </div>

                      {/* Bookings */}
                      {tableBookings.map((booking) => {
                        const style = calculateBookingStyle(booking);
                        const colorClass = getBookingColor(booking);
                        const hasSpecialRequest = booking.special_requests && 
                          booking.special_requests.toLowerCase().includes('tasting');

                        return (
                          <div
                            key={booking.id}
                            className={`absolute top-1 bottom-1 ${colorClass} rounded border-l-2 px-2 py-1 cursor-pointer hover:shadow-md transition-shadow overflow-hidden`}
                            style={style}
                            title={`${booking.customer_name} - ${booking.start_time} (${booking.party_size} guests)`}
                          >
                            <div className="flex items-start justify-between gap-1 h-full">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold truncate">
                                  {booking.customer_name}
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  <Clock className="h-3 w-3" />
                                  <span>{booking.start_time}</span>
                                  <UsersIcon className="h-3 w-3 ml-1" />
                                  <span>{booking.party_size}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-0.5">
                                {booking.customer_name.includes('❤') && (
                                  <Heart className="h-3 w-3 fill-current" />
                                )}
                                {hasSpecialRequest && (
                                  <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                    Tasting Menu
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Empty state */}
          {tables.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tables configured</p>
            </div>
          )}
        </div>
      </Card>

      {/* Footer stats */}
      <div className="flex items-center justify-between text-sm text-gray-600 px-2">
        <div>
          {dayBookings.length} {dayBookings.length === 1 ? 'booking' : 'bookings'} today
        </div>
        <div>
          {dayBookings.reduce((sum, b) => sum + b.party_size, 0)} total guests
        </div>
      </div>
    </div>
  );
};

export default TimelineView;

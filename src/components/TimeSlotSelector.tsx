
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertCircle } from 'lucide-react';
import { format, addMinutes, parseISO } from 'date-fns';
import { getAvailableTimeSlots } from '@/services/supabaseBookingService';

interface TimeSlotSelectorProps {
  date: Date;
  partySize: number;
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  date,
  partySize,
  selectedTime,
  onTimeSelect
}) => {
  const [availableSlots, setAvailableSlots] = useState<{time: string, available: boolean, tableSize?: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAvailableSlots = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Loading available slots for:', { date, partySize });
        const slots = await getAvailableTimeSlots(date, partySize);
        console.log('Available slots loaded:', slots);
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Error loading time slots:', error);
        setError('Failed to load available time slots');
      } finally {
        setLoading(false);
      }
    };

    loadAvailableSlots();
  }, [date, partySize]);

  const formatTimeSlot = (time: string) => {
    const [hours, minutes] = time.split(':');
    const timeObj = new Date();
    timeObj.setHours(parseInt(hours), parseInt(minutes));
    return format(timeObj, 'h:mm a');
  };

  const getTableSizeLabel = (capacity?: number) => {
    if (!capacity) return '';
    return `Table for ${capacity}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <span className="ml-3 text-gray-600">Loading available times...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Times
          </h3>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const availableSlotCount = availableSlots.filter(slot => slot.available).length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600 mb-2">
          Select your preferred dining time
        </p>
        <p className="text-sm text-gray-500">
          {format(date, 'EEEE, MMMM do')} • Party of {partySize}
        </p>
      </div>

      {availableSlotCount === 0 ? (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">
              No tables available
            </h3>
            <p className="text-red-600">
              All tables are booked for a party of {partySize} on this date. 
              Please try a different date or party size.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Clock className="h-5 w-5 mr-2" />
                Available Times ({availableSlotCount} slots)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableSlots.map(({ time, available, tableSize }) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'default' : available ? 'outline' : 'ghost'}
                    disabled={!available}
                    className={`
                      h-auto p-3 flex flex-col items-center space-y-1
                      ${selectedTime === time ? 'bg-amber-600 hover:bg-amber-700' : 
                        available ? 'hover:bg-amber-50 border-green-300 text-green-700' : 
                        'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'}
                    `}
                    onClick={() => available && onTimeSelect(time)}
                  >
                    <div className="font-medium">
                      {formatTimeSlot(time)}
                    </div>
                    {available && tableSize && (
                      <div className="text-xs opacity-75">
                        {getTableSizeLabel(tableSize)}
                      </div>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedTime && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <p className="text-green-800 font-medium">
                  Selected Time: {formatTimeSlot(selectedTime)}
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Reservation ends at {formatTimeSlot(
                    format(addMinutes(parseISO(`2024-01-01T${selectedTime}`), 150), 'HH:mm')
                  )}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="text-sm text-gray-500 text-center space-y-1">
        <p>• Each reservation is for 2.5 hours</p>
        <p>• Times shown are start times for your reservation</p>
        <p>• Green indicates available slots</p>
      </div>
    </div>
  );
};

export default TimeSlotSelector;

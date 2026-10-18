
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, isSameDay, startOfToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DateSelectorProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateSelect }) => {
  const today = startOfToday();
  const maxDate = addDays(today, 60); // Allow booking up to 60 days in advance
  
  // Quick date selection buttons
  const quickDates = [
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: addDays(today, 1) },
    { label: 'This Weekend', date: addDays(today, 5 - today.getDay()) }, // Next Saturday
    { label: 'Next Week', date: addDays(today, 7) }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          Select your preferred dining date
        </p>
      </div>
      
      {/* Quick date selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {quickDates.map((item) => (
          <Button
            key={item.label}
            variant={selectedDate && isSameDay(selectedDate, item.date) ? "default" : "outline"}
            className={`${selectedDate && isSameDay(selectedDate, item.date) ? 'bg-amber-600 hover:bg-amber-700' : 'hover:bg-amber-50'}`}
            onClick={() => onDateSelect(item.date)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {/* Calendar */}
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          disabled={(date) => date < today || date > maxDate}
          initialFocus
          className="rounded-md border shadow-md bg-white"
        />
      </div>

      {/* Selected date display */}
      {selectedDate && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center border rounded-lg p-3 bg-white shadow-sm w-1/2">
            <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-gray-800 font-medium">
              {format(selectedDate, 'dd/MM/yyyy')}
            </span>
          </div>
          
          <div className="rounded-full bg-amber-50 border border-amber-100 py-2 px-4 text-center">
            <span className="text-amber-800 font-medium">
              {format(selectedDate, 'EEEE')},<br />
              {format(selectedDate, 'MMMM do, yyyy')}
            </span>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500 text-center space-y-1 mt-4 p-3 bg-gray-50 rounded-md">
        <p>• Restaurant hours: 11:00 AM - 10:00 PM daily</p>
        <p>• Last booking available at 7:30 PM</p>
        <p>• Each reservation is for 2.5 hours</p>
      </div>
    </div>
  );
};

export default DateSelector;

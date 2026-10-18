import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Search } from 'lucide-react';

interface TopFilterBarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedTime: string;
  onTimeChange: (time: string) => void;
  selectedPartySize: string | number;
  onPartySizeChange: (size: string) => void;
  onReserve: (options: {
    date: string;
    time: string;
    partySize: string | number;
  }) => void;
}

const getNext30Days = () => {
  const days: string[] = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date.toISOString().split('T')[0]);
  }
  return days;
};

const getDaysInMonth = (year: number, month: number) => {
  const days: string[] = [];
  const lastDay = new Date(year, month, 0).getDate();
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1;
  const todayDate = now.getDate();

  for (let day = 1; day <= lastDay; day++) {
    if (
      (year === todayYear && month === todayMonth && day >= todayDate) ||
      (year !== todayYear || month !== todayMonth)
    ) {
      // Use local time for formatting
      const yyyy = year.toString().padStart(4, '0');
      const mm = month.toString().padStart(2, '0');
      const dd = day.toString().padStart(2, '0');
      days.push(`${yyyy}-${mm}-${dd}`);
    }
  }
  return days;
};

const timeSlots = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00'
];

const partySizes = Array.from({ length: 8 }, (_, i) => (i + 1).toString());

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const TopFilterBar: React.FC<TopFilterBarProps> = ({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  selectedPartySize,
  onPartySizeChange,
  onReserve,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableDays, setAvailableDays] = useState<string[]>([]);

  // Generate years (current year + next 2 years)
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i);

  useEffect(() => {
    const days = getDaysInMonth(selectedYear, selectedMonth);
    setAvailableDays(days);
    
    // If current selected date is not in the new month/year, clear it
    if (selectedDate && !days.includes(selectedDate)) {
      onDateChange('');
    }
  }, [selectedMonth, selectedYear, selectedDate, onDateChange]);

  return (
    <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg py-4 px-6 sticky top-0 z-40 border-b border-amber-200 mt-20">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {/* Date Filter Group */}
          <div className="flex gap-2">
            {/* Month Dropdown */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <select
                className="appearance-none bg-white border-2 border-amber-200 rounded-lg pl-10 pr-8 py-3 min-w-[140px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 hover:border-amber-300 shadow-sm"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Year Dropdown */}
            <div className="relative group">
              <select
                className="appearance-none bg-white border-2 border-amber-200 rounded-lg px-4 py-3 min-w-[100px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 hover:border-amber-300 shadow-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Day Dropdown */}
            <div className="relative group">
              <select
                className="appearance-none bg-white border-2 border-amber-200 rounded-lg px-4 py-3 min-w-[120px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 hover:border-amber-300 shadow-sm"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
              >
                <option value="">Day</option>
                {availableDays.map(date => (
                  <option key={date} value={date}>
                    {new Date(date).getDate()}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Time Filter */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <select
              className="appearance-none bg-white border-2 border-amber-200 rounded-lg pl-10 pr-8 py-3 min-w-[140px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 hover:border-amber-300 shadow-sm"
              value={selectedTime}
              onChange={(e) => onTimeChange(e.target.value)}
            >
              <option value="">Select Time</option>
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Party Size Filter */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <select
              className="appearance-none bg-white border-2 border-amber-200 rounded-lg pl-10 pr-8 py-3 min-w-[140px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 hover:border-amber-300 shadow-sm"
              value={selectedPartySize.toString()}
              onChange={(e) => onPartySizeChange(e.target.value)}
            >
              <option value="">Party Size</option>
              {partySizes.map(size => (
                <option key={size} value={size}>{size} {size === '1' ? 'Person' : 'People'}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>



          {/* Search Button */}
          <button
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 font-medium relative transition-all duration-200"
            type="button"
            onClick={() => onReserve({ date: selectedDate, time: selectedTime, partySize: selectedPartySize })}
          >
            <Search className="h-4 w-4" />
            Reserve Table
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopFilterBar; 
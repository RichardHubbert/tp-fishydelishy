import React, { useState, useEffect } from 'react';
import BookingModal from '@/components/BookingModal';
import NavigationHeader from '@/components/NavigationHeader';
import HeroSection from '@/components/HeroSection';
import TableSizesSection from '@/components/TableSizesSection';
import RestaurantInfoSection from '@/components/RestaurantInfoSection';
import TopFilterBar from '@/components/TopFilterBar';
import ElevenLabsWidget from '@/components/ElevenLabsWidget';
import { useAuth } from '@/hooks/useAuth';
import { fetchRestaurantById, Restaurant } from '@/services/restaurantService';
import { fetchTables, fetchBookingsForDate } from '@/services/supabaseBookingService';
import { addMinutes, format } from 'date-fns';
import { siteConfig } from '@/config/site';



const Index = () => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const { user } = useAuth();
  const [bookingRestaurant, setBookingRestaurant] = useState<Restaurant | undefined>(undefined);
  const [defaultRestaurant, setDefaultRestaurant] = useState<Restaurant | undefined>(undefined);

  // Filter bar state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedPartySize, setSelectedPartySize] = useState(''); // always string
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookedMap, setBookedMap] = useState<{ [restaurantId: string]: boolean }>({});

  // New: State for prepopulating the booking modal
  const [initialDate, setInitialDate] = useState('');
  const [initialTime, setInitialTime] = useState('');
  const [initialPartySize, setInitialPartySize] = useState('');

  const handlePartySizeChange = (value: string) => {
    setSelectedPartySize(value);
  };

  // Handler for Reserve Table button
  const handleReserve = ({ date, time, partySize }: { date: string; time: string; partySize: string | number }) => {
    setInitialDate(date);
    setInitialTime(time);
    setInitialPartySize(partySize.toString());
    setIsBookingModalOpen(true);
  };

  useEffect(() => {
    const fetchAndFilter = async () => {
      setLoading(true);
      setError(null);
      try {
        const restaurant = await fetchRestaurantById(siteConfig.ids.restaurantId);
        const allRestaurants = restaurant ? [restaurant] : [];
        setFilteredRestaurants(allRestaurants);
        setDefaultRestaurant(restaurant ?? undefined);

        // If date, time, and party size are selected, check booking status
        if (selectedDate && selectedTime && selectedPartySize) {
          const tables = await fetchTables();
          const bookings = await fetchBookingsForDate(new Date(selectedDate));
          const partySizeNum = parseInt(selectedPartySize);
          const [hours, minutes] = selectedTime.split(':').map(Number);
          const startDate = new Date(selectedDate);
          startDate.setHours(hours, minutes, 0, 0);
          const endDate = addMinutes(startDate, 150); // 2.5 hours
          const endTime = format(endDate, 'HH:mm');

          // Check if there are any available tables for the party size
          const suitableTables = tables.filter(t => t.capacity >= partySizeNum);
          let anyTableAvailable = false;
          
          for (const table of suitableTables) {
            const tableBookings = bookings.filter(b => b.table_id === table.id);
            const hasConflict = tableBookings.some(booking => {
              const parseTime = (time: string) => {
                const [h, m] = time.split(':').map(Number);
                return h * 60 + m;
              };
              const newStart = parseTime(selectedTime);
              const newEnd = parseTime(endTime);
              const existingStart = parseTime(booking.start_time);
              const existingEnd = parseTime(booking.end_time);
              return (newStart < existingEnd && newEnd > existingStart);
            });
            if (!hasConflict) {
              anyTableAvailable = true;
              break;
            }
          }

          // All restaurants have the same availability since they share the same tables
          const newBookedMap: { [restaurantId: string]: boolean } = {};
          for (const restaurant of allRestaurants) {
            newBookedMap[restaurant.id] = !anyTableAvailable;
          }
          setBookedMap(newBookedMap);
        } else {
          setBookedMap({});
        }
      } catch (e) {
        setError('Failed to fetch restaurants.');
      } finally {
        setLoading(false);
      }
    };
    fetchAndFilter();
  }, [selectedDate, selectedTime, selectedPartySize]);

  const handleBookingClick = (restaurant?: Restaurant) => {
    setBookingRestaurant(restaurant);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader 
        onBookingClick={handleBookingClick}
      />
      <TopFilterBar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedTime={selectedTime}
        onTimeChange={setSelectedTime}
        selectedPartySize={selectedPartySize}
        onPartySizeChange={handlePartySizeChange}
        onReserve={handleReserve}
      />
      {loading && <div className="text-center py-8">Loading restaurants...</div>}
      {error && <div className="text-center text-red-600 py-4">{error}</div>}
      {!loading && filteredRestaurants.length === 0 && (
        <div className="text-center text-gray-500 py-8">No restaurants found.</div>
      )}
      <HeroSection 
        onBookTable={() => handleBookingClick()}
        restaurantName={defaultRestaurant?.name || siteConfig.business.name}
        imageUrl={defaultRestaurant?.image_url || undefined}
      />
      <TableSizesSection />
      <RestaurantInfoSection 
        onBookingClick={handleBookingClick}
        selectedRestaurant={undefined}
      />

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
        restaurant={bookingRestaurant}
        initialDate={initialDate}
        initialTime={initialTime}
        initialPartySize={initialPartySize}
      />
      
      {defaultRestaurant && (defaultRestaurant as any).elevenlabs_enabled && (defaultRestaurant as any).elevenlabs_agent_id && (
        <ElevenLabsWidget agentId={(defaultRestaurant as any).elevenlabs_agent_id} />
      )}
    </div>
  );
};

export default Index;

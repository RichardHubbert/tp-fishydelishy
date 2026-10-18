import React, { useState, useEffect } from 'react';
import BookingModal from '@/components/BookingModal';
import NavigationHeader from '@/components/NavigationHeader';
import HeroSection from '@/components/HeroSection';
import TableSizesSection from '@/components/TableSizesSection';
import RestaurantInfoSection from '@/components/RestaurantInfoSection';
import TopFilterBar from '@/components/TopFilterBar';
import { fetchRestaurants, Restaurant } from '@/services/restaurantService';
import ElevenLabsWidget from '@/components/ElevenLabsWidget';
import { siteConfig } from '@/config/site';

const Index = () => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialDate, setInitialDate] = useState('');
  const [initialTime, setInitialTime] = useState('');
  const [initialPartySize, setInitialPartySize] = useState('');

  useEffect(() => {
    const loadRestaurant = async () => {
      setLoading(true);
      setError(null);
      try {
        const restaurants = await fetchRestaurants();
        setRestaurant(restaurants.find((item) => item.is_default) || restaurants[0]);
      } catch (loadError) {
        console.error('Error loading restaurant:', loadError);
        setError('Failed to load the restaurant.');
      } finally {
        setLoading(false);
      }
    };

    loadRestaurant();
  }, []);

  const openBooking = () => {
    setIsBookingModalOpen(true);
  };

  const handleReserve = ({ date, time, partySize }: { date: string; time: string; partySize: string | number }) => {
    setInitialDate(date);
    setInitialTime(time);
    setInitialPartySize(partySize.toString());
    openBooking();
  };

  const restaurantName = restaurant?.name || siteConfig.business.name;

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader
        onBookingClick={openBooking}
        brandName={restaurantName}
      />
      <TopFilterBar
        selectedDate={initialDate}
        onDateChange={setInitialDate}
        selectedTime={initialTime}
        onTimeChange={setInitialTime}
        selectedPartySize={initialPartySize}
        onPartySizeChange={setInitialPartySize}
        onReserve={handleReserve}
      />
      {loading && <div className="text-center py-8">Loading restaurant...</div>}
      {error && <div className="text-center text-red-600 py-4">{error}</div>}
      <HeroSection
        onBookTable={openBooking}
        restaurantName={restaurantName}
        imageUrl={restaurant?.hero_image_url || undefined}
      />
      <TableSizesSection />
      <RestaurantInfoSection
        onBookingClick={openBooking}
        selectedRestaurant={restaurant}
      />
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        restaurant={restaurant}
        initialDate={initialDate}
        initialTime={initialTime}
        initialPartySize={initialPartySize}
      />
      {restaurant?.elevenlabs_enabled && restaurant.elevenlabs_agent_id && (
        <ElevenLabsWidget agentId={restaurant.elevenlabs_agent_id} />
      )}
    </div>
  );
};

export default Index;

import React, { useEffect, useState } from 'react';
import BookingModal from '@/components/BookingModal';
import { fetchRestaurantById, Restaurant } from '@/services/restaurantService';

const EmbedBook = () => {
  const params = new URLSearchParams(window.location.search);
  const restaurantId = params.get('restaurant') || '';
  const [restaurant, setRestaurant] = useState<Restaurant | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const found = restaurantId ? await fetchRestaurantById(restaurantId) : null;
        setRestaurant(found || undefined);
        if (!found) setError('Restaurant not found.');
      } catch {
        setError('Unable to open booking.');
      }
    };
    load();
  }, [restaurantId]);

  const framed = params.get('frame') === '1';

  useEffect(() => {
    if (!framed) return;
    document.body.style.margin = '0';
    document.body.style.background = '#fff';
  }, [framed]);

  const close = () => {
    if (framed) {
      window.history.back();
      return;
    }
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'TP_CORE_CLOSE' }, '*');
      return;
    }
    window.history.back();
  };

  if (error) {
    return <p className="p-6 text-red-700" role="alert">{error}</p>;
  }

  if (!restaurant) {
    return <p className="p-4 text-sm text-slate-500">Loading booking form…</p>;
  }

  return (
    <BookingModal
      isOpen
      presentation={framed ? 'page' : 'dialog'}
      onClose={close}
      restaurant={restaurant}
      initialDate={params.get('date') || ''}
      initialTime={params.get('time') || ''}
      initialPartySize={params.get('party') || ''}
      initialStep={Number(params.get('step') || 1)}
    />
  );
};

export default EmbedBook;

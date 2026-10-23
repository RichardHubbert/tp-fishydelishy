import React, { useEffect, useState } from 'react';
import BookingCard, { BookingSelection } from '@/components/BookingCard';
import { fetchRestaurantById, Restaurant } from '@/services/restaurantService';
import { siteConfig } from '@/config/site';

const bookUrl = (restaurantId: string, selection: BookingSelection) => {
  const params = new URLSearchParams({
    restaurant: restaurantId,
    date: selection.date,
    time: selection.time,
    party: String(selection.partySize),
    step: String(selection.step),
  });
  const base = siteConfig.urls.basePath === '/' ? '' : siteConfig.urls.basePath;
  return `${base}/book?${params.toString()}`;
};

const EmbedCard = () => {
  const restaurantId = new URLSearchParams(window.location.search).get('restaurant') || siteConfig.business.restaurantId;
  const [restaurant, setRestaurant] = useState<Restaurant | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
  }, []);

  useEffect(() => {
    const sendHeight = () => {
      const height = Math.ceil(document.body.scrollHeight);
      window.parent.postMessage({ type: 'TP_CORE_CARD_HEIGHT', height }, '*');
    };
    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
    return () => observer.disconnect();
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!restaurantId) {
          setError('Add a restaurant-id to this card.');
          return;
        }
        const found = await fetchRestaurantById(restaurantId);
        setRestaurant(found || undefined);
        if (!found) setError('Restaurant not found.');
      } catch {
        setError('Unable to load this restaurant.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [restaurantId]);

  const openBooking = (selection: BookingSelection) => {
    if (!restaurantId) return;
    const hostedByWidget = new URLSearchParams(window.location.search).get('widget') === '1';
    if (hostedByWidget && window.parent !== window) {
      window.parent.postMessage({ type: 'TP_CORE_OPEN_BOOKING', restaurantId, ...selection }, '*');
      return;
    }
    const next = bookUrl(restaurantId, selection);
    window.location.assign(window.parent !== window ? `${next}&frame=1` : next);
  };

  if (loading) {
    return <p className="p-4 text-sm text-slate-500">Loading booking card…</p>;
  }

  if (error || !restaurant) {
    return <p className="p-4 text-sm text-red-700" role="alert">{error || 'Restaurant not found.'}</p>;
  }

  return <BookingCard restaurantId={restaurant.id} onBook={openBooking} />;
};

export default EmbedCard;

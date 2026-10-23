import { siteConfig } from '@/config/site';

const fromEnv = (import.meta.env.VITE_RESTAURANT_ID || '').trim();
const fromSite = (siteConfig.business.restaurantId || '').trim();

/**
 * The restaurant this copy writes to. A fresh clone has neither value.
 * `npm run new-restaurant` stores a new id in `.env`, which is not committed.
 */
export const siteRestaurantId = fromEnv || fromSite;

export const requireRestaurantId = () => {
  if (!siteRestaurantId) {
    throw new Error('This copy has no restaurant id. Run npm run new-restaurant.');
  }
  return siteRestaurantId;
};

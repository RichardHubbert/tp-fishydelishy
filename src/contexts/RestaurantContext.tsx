import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Restaurant } from '@/components/RestaurantSelector';
import { siteConfig } from '@/config/site';

interface RestaurantContextType {
  selectedRestaurant: Restaurant | undefined;
  setSelectedRestaurant: (restaurant: Restaurant | undefined) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

interface RestaurantProviderProps {
  children: ReactNode;
}

// Default restaurant data from config
const defaultRestaurant: Restaurant = {
  id: siteConfig.ids.restaurantId,
  name: siteConfig.business.name,
  address: siteConfig.contact.address,
  cuisine: 'Fine Dining',
  rating: 4.8,
  imageUrl: siteConfig.branding.assets.heroImage
};

export const RestaurantProvider: React.FC<RestaurantProviderProps> = ({ children }) => {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | undefined>(defaultRestaurant);

  return (
    <RestaurantContext.Provider value={{ selectedRestaurant, setSelectedRestaurant }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = (): RestaurantContextType => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}; 
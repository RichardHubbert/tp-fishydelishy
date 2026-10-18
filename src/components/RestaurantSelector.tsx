import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { fetchRestaurants } from '@/services/restaurantService';

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine: string;
  rating: number | null;
  imageUrl?: string;
}

interface RestaurantSelectorProps {
  selectedRestaurant?: Restaurant;
  onRestaurantChange: (restaurant: Restaurant) => void;
  className?: string;
}

const FALLBACK_RESTAURANTS: Restaurant[] = [];

const RestaurantSelector: React.FC<RestaurantSelectorProps> = ({
  selectedRestaurant,
  onRestaurantChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>(FALLBACK_RESTAURANTS);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(FALLBACK_RESTAURANTS);
  const [isLoading, setIsLoading] = useState(true);

  // Load restaurants from Supabase
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await fetchRestaurants();
        if (data.length > 0) {
          // Transform the data to match our interface
          const transformedData = data.map(restaurant => ({
            id: restaurant.id,
            name: restaurant.name,
            address: restaurant.address,
            cuisine: restaurant.cuisine,
            rating: restaurant.rating,
            imageUrl: restaurant.image_url || undefined
          }));
          setRestaurants(transformedData);
          setFilteredRestaurants(transformedData);
        }
      } catch (error) {
        console.error('Error loading restaurants:', error);
        // Keep fallback data if loading fails
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurants();
  }, []);

  // Filter restaurants based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    }
  }, [searchQuery, restaurants]);

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    onRestaurantChange(restaurant);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-white hover:bg-gray-50 border-gray-200"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-left">
                {selectedRestaurant ? (
                  <div>
                    <div className="font-medium text-gray-900">{selectedRestaurant.name}</div>
                    <div className="text-sm text-gray-500">{selectedRestaurant.cuisine}</div>
                  </div>
                ) : (
                  <span className="text-gray-500">Select a restaurant</span>
                )}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          className="w-80 p-0" 
          align="start"
          sideOffset={4}
        >
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200 focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {filteredRestaurants.length > 0 ? (
              filteredRestaurants.map((restaurant) => (
                <DropdownMenuItem
                  key={restaurant.id}
                  onClick={() => handleRestaurantSelect(restaurant)}
                  className="p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-start gap-3 w-full">
                    {restaurant.imageUrl && (
                      <img
                        src={restaurant.imageUrl}
                        alt={restaurant.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {restaurant.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {restaurant.cuisine}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {restaurant.address}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-amber-600 font-medium">
                          ★ {restaurant.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No restaurants found matching "{searchQuery}"
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default RestaurantSelector; 
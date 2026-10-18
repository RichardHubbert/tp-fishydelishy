import React from 'react';
import { Calendar, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Restaurant } from './RestaurantSelector';
import { siteConfig, getPrimaryColorClass, replaceTokens } from '@/config/site';

interface RestaurantInfoSectionProps {
  onBookingClick: () => void;
  selectedRestaurant?: Restaurant;
}

const RestaurantInfoSection = ({ onBookingClick, selectedRestaurant }: RestaurantInfoSectionProps) => {
  const { business, contact, hours, branding } = siteConfig;
  const { primary, primaryShade, hover } = branding.colors;
  const restaurantName = selectedRestaurant?.name || business.name;
  const restaurantAddress = selectedRestaurant?.address || contact.address;
  const restaurantPhone = selectedRestaurant?.phone || contact.phone;
  const restaurantEmail = selectedRestaurant?.email || contact.email;
  
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              {replaceTokens(siteConfig.features.info.heading, { name: restaurantName })}
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Clock className={`h-6 w-6 text-${primary}-${primaryShade} mt-1`} />
                <div>
                  <h3 className="font-semibold text-gray-900">Opening Hours</h3>
                  <p className="text-gray-600">{hours.display}</p>
                  <p className="text-sm text-gray-500">Last booking at {hours.lastBooking}</p>
                </div>
              </div>

              {restaurantAddress && (
                <div className="flex items-start space-x-4">
                  <MapPin className={`h-6 w-6 text-${primary}-${primaryShade} mt-1`} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Location</h3>
                    <p className="text-gray-600">{restaurantAddress}</p>
                  </div>
                </div>
              )}

              {restaurantPhone && (
                <div className="flex items-start space-x-4">
                  <Phone className={`h-6 w-6 text-${primary}-${primaryShade} mt-1`} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Bookings</h3>
                    <p className="text-gray-600">{restaurantPhone}</p>
                  </div>
                </div>
              )}

              {restaurantEmail && (
                <div className="flex items-start space-x-4">
                  <Mail className={`h-6 w-6 text-${primary}-${primaryShade} mt-1`} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">{restaurantEmail}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Ready to Dine?
            </h3>
            <div className="space-y-4">
              <Button 
                className={`w-full bg-${primary}-${primaryShade} hover:bg-${primary}-${hover} text-lg py-3`}
                onClick={onBookingClick}
              >
                <Calendar className="mr-2 h-5 w-5" />
                Make a Booking
              </Button>
              <p className="text-sm text-gray-500 text-center">
                Booking slots available every 30 minutes
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RestaurantInfoSection;

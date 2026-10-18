
import React from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickReserveCardProps {
  onBookingClick: () => void;
}

const QuickReserveCard = ({ onBookingClick }: QuickReserveCardProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Quick Reserve
      </h3>
      <div className="space-y-4">
        <Button 
          className="w-full bg-amber-600 hover:bg-amber-700 text-lg py-3"
          onClick={onBookingClick}
        >
          Reserve Table
        </Button>
        <p className="text-sm text-gray-500 text-center">
          Booking slots available every 30 minutes
        </p>
      </div>
    </div>
  );
};

export default QuickReserveCard;

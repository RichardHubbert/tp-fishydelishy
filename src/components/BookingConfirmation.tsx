import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Calendar, Clock, Users, Mail, Phone, MessageSquare, MapPin } from 'lucide-react';
import { format, parseISO, addMinutes } from 'date-fns';
import { BookingData } from '@/components/BookingModal';

interface BookingConfirmationProps {
  bookingData: BookingData;
  restaurantName?: string;
  onClose: () => void;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ bookingData, restaurantName, onClose }) => {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const timeObj = new Date();
    timeObj.setHours(parseInt(hours), parseInt(minutes));
    return format(timeObj, 'h:mm a');
  };

  const getEndTime = (startTime: string) => {
    const endTime = format(addMinutes(parseISO(`2024-01-01T${startTime}`), 150), 'HH:mm');
    return formatTime(endTime);
  };

  // Generate a random booking reference
  const bookingRef = `TP${Date.now().toString().slice(-6)}`;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-gray-600">
            Your table has been successfully reserved
          </p>
        </div>
      </div>

      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-center text-green-800">
            Booking Reference: {bookingRef}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center border rounded-lg p-3 bg-white shadow-sm">
                <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-800 font-medium">
                  {format(bookingData.date, 'dd/MM/yyyy')}
                </span>
              </div>
              
              <div className="rounded-full bg-green-50 border border-green-100 py-2 px-4 text-center">
                <span className="text-green-800 font-medium">
                  {format(bookingData.date, 'EEEE')},<br />
                  {format(bookingData.date, 'MMMM do, yyyy')}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center border rounded-lg p-3 bg-white shadow-sm">
                <Clock className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-800 font-medium">
                  {formatTime(bookingData.startTime)}
                </span>
              </div>
              
              <div className="rounded-full bg-green-50 border border-green-100 py-2 px-4 text-center">
                <span className="text-green-800">
                  <span className="font-medium">{formatTime(bookingData.startTime)}</span>
                  <span className="mx-1">→</span>
                  <span>{getEndTime(bookingData.startTime)}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Party Size</p>
                <p className="text-green-700">{bookingData.partySize} people</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Location</p>
                <p className="text-green-700">{restaurantName || 'Your Restaurant'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-gray-700">{bookingData.customerEmail}</span>
          </div>
          
          {bookingData.customerPhone && (
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{bookingData.customerPhone}</span>
            </div>
          )}

          {bookingData.specialRequests && (
            <div className="flex items-start space-x-3">
              <MessageSquare className="h-4 w-4 text-gray-400 mt-1" />
              <div>
                <p className="font-medium text-gray-700">Special Requests:</p>
                <p className="text-gray-600">{bookingData.specialRequests}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-medium text-amber-800 mb-2">Important Information</h3>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• A confirmation email will be sent to {bookingData.customerEmail}</li>
          <li>• Please arrive on time for your reservation</li>
          <li>• Contact us at (555) 123-4567 if you need to modify your booking</li>
          <li>• Cancellations should be made at least 2 hours in advance</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onClose}
          className="flex-1 bg-amber-600 hover:bg-amber-700"
        >
          Done
        </Button>
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="flex-1"
        >
          Print Confirmation
        </Button>
      </div>
    </div>
  );
};

export default BookingConfirmation;

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { siteConfig } from '@/config/site';

interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
}
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar, Users, Clock, CheckCircle, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DateSelector from '@/components/DateSelector';
import PartySizeSelector from '@/components/PartySizeSelector';
import TimeSlotSelector from '@/components/TimeSlotSelector';
import CustomerForm from '@/components/CustomerForm';
import BookingConfirmation from '@/components/BookingConfirmation';
import { createBooking } from '@/services/supabaseBookingService';
import { sendBookingConfirmationEmail } from '@/services/emailService';
import { fetchRestaurants, Restaurant } from '@/services/restaurantService';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant?: Restaurant;
  initialDate?: string;
  initialTime?: string;
  initialPartySize?: string;
}

export interface BookingData {
  restaurantId: string;
  date: Date;
  startTime: string;
  partySize: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  specialRequests?: string;
}

const steps = [
  { id: 1, title: 'Date', icon: Calendar },
  { id: 2, title: 'Party Size', icon: Users },
  { id: 3, title: 'Time', icon: Clock },
  { id: 4, title: 'Details', icon: Users },
  { id: 5, title: 'Confirm', icon: CheckCircle },
];

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, restaurant, initialDate, initialTime, initialPartySize }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({ 
    restaurantId: siteConfig.ids.restaurantId, // Default restaurant ID from config
    date: undefined 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationData, setConfirmationData] = useState<BookingData | null>(null);
  const { toast } = useToast();
  // Remove selectedCounty, setSelectedCounty, counties, restaurantOptions, fetchAndSetRestaurants, and all logic related to restaurant selection
  // In renderStepContent, step 1 should only show the DateSelector
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-fill form with initial values from filter selections
  useEffect(() => {
    if (isOpen) {
      const updatedData: Partial<BookingData> = {
        restaurantId: siteConfig.ids.restaurantId, // Always use default restaurant
        date: initialDate ? new Date(initialDate) : undefined,
        startTime: initialTime || '',
        partySize: initialPartySize ? parseInt(initialPartySize) : undefined,
      };
      setBookingData(updatedData);
    }
  }, [isOpen, initialDate, initialTime, initialPartySize]);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setBookingData({ 
      restaurantId: siteConfig.ids.restaurantId, // Keep default restaurant ID
      date: undefined 
    });
    setConfirmationData(null);
    setSubmitError(null);
    onClose();
  };

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData({ ...bookingData, ...data });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return bookingData.date; // Only require date
      case 2:
        return bookingData.partySize;
      case 3:
        return bookingData.startTime;
      case 4:
        return bookingData.customerName && bookingData.customerEmail;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!bookingData.date || !bookingData.startTime || !bookingData.partySize || 
        !bookingData.customerName || !bookingData.customerEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields, including date, time, and party size.",
        variant: "destructive"
      });
      setSubmitError('Please fill in all required fields, including date, time, and party size.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createBooking({
        restaurantId: bookingData.restaurantId,
        date: bookingData.date,
        startTime: bookingData.startTime,
        partySize: bookingData.partySize,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        specialRequests: bookingData.specialRequests
      });
      console.log('🎉 Booking submission successful!', result);
      // Convert Booking to BookingData
      const confirmedBooking: BookingData = {
        restaurantId: result.restaurant_id,
        date: new Date(result.booking_date),
        startTime: result.start_time,
        partySize: result.party_size,
        customerName: result.customer_name,
        customerEmail: result.customer_email,
        customerPhone: result.customer_phone,
        specialRequests: result.special_requests
      };
      setConfirmationData(confirmedBooking);
      setCurrentStep(5);
      
      // Send confirmation email
      console.log('📧 Attempting to send confirmation email...');
      const emailResult = await sendBookingConfirmationEmail(result);
      
      if (emailResult.success) {
        toast({
          title: "Booking Confirmed!",
          description: "Your table reservation has been successfully created. A confirmation email has been sent to your inbox.",
        });
      } else {
        console.error('📧 Email failed:', emailResult.error);
        toast({
          title: "Booking Confirmed!",
          description: `Your table reservation has been successfully created. (Email delivery failed: ${emailResult.error})`,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('💥 Booking submission failed:', error);
      setSubmitError('Booking failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <DateSelector
            selectedDate={bookingData.date}
            onDateSelect={date => setBookingData({ ...bookingData, date })}
          />
        );
      case 2:
        return (
          <PartySizeSelector
            selectedSize={bookingData.partySize}
            onSizeSelect={(partySize) => updateBookingData({ partySize })}
          />
        );
      case 3:
        return (
          <TimeSlotSelector
            date={bookingData.date!}
            partySize={bookingData.partySize!}
            selectedTime={bookingData.startTime}
            onTimeSelect={time => updateBookingData({ startTime: time })}
          />
        );
      case 4:
        return (
          <CustomerForm
            data={bookingData}
            onUpdate={updateBookingData}
          />
        );
      case 5:
        return (
          <BookingConfirmation
            bookingData={bookingData as BookingData}
            onClose={handleClose}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Reserve Your Table
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${isActive ? 'bg-amber-600 text-white' : 
                    isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  <Icon className="h-5 w-5" />
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-8 h-0.5 mx-2
                    ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">
              {steps[currentStep - 1]?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Show error if booking fails */}
        {submitError && (
          <div className="text-red-600 text-sm mt-2 text-center">{submitError}</div>
        )}

        {/* Navigation Buttons */}
        {currentStep < 5 && (
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            
            {currentStep === 4 ? (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 flex items-center"
              >
                {isSubmitting ? 'Creating Booking...' : 'Confirm Booking'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-amber-600 hover:bg-amber-700 flex items-center"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;

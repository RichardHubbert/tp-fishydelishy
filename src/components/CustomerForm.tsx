
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, MessageSquare } from 'lucide-react';
import { BookingData } from '@/components/BookingModal';

interface CustomerFormProps {
  data: Partial<BookingData>;
  onUpdate: (data: Partial<BookingData>) => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ data, onUpdate }) => {
  const handleInputChange = (field: keyof BookingData, value: string) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600 mb-6">
          Please provide your contact information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <User className="h-5 w-5 mr-2" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-sm font-medium">
                Full Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="customerName"
                  type="text"
                  placeholder="Enter your full name"
                  value={data.customerName || ''}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail" className="text-sm font-medium">
                Email Address *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={data.customerEmail || ''}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone" className="text-sm font-medium">
              Phone Number (Optional)
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="customerPhone"
                type="tel"
                placeholder="+44 20 7946 0958"
                value={data.customerPhone || ''}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialRequests" className="text-sm font-medium">
              Special Requests (Optional)
            </Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="specialRequests"
                placeholder="Any dietary restrictions, celebrations, or special requirements..."
                value={data.specialRequests || ''}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                className="pl-10 min-h-[80px]"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-gray-500 space-y-1">
        <p>• We'll send a confirmation email to the address provided</p>
        <p>• Your phone number helps us contact you if needed</p>
        <p>• Special requests are subject to availability</p>
      </div>
    </div>
  );
};

export default CustomerForm;

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sendCustomerToCRM } from '@/services/crmService';
import { useToast } from '@/hooks/use-toast';
import { siteConfig } from '@/config/site';

const CRMTestButton: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const handleTestCRM = async () => {
    setIsTesting(true);
    
    try {
      const testData = {
        customerName: 'John Smith',
        customerEmail: 'john.smith@example.com',
        customerPhone: '+44 20 7946 0958',
        specialRequests: 'Window seat preferred',
        restaurantId: siteConfig.ids.restaurantId,
        restaurantName: siteConfig.business.name,
        bookingDate: '2024-01-20',
        startTime: '19:30',
        partySize: 3,
        bookingId: 'booking-test-' + Date.now(),
        businessId: siteConfig.ids.businessId
      };

      console.log('🧪 Testing CRM integration with realistic data:', testData);
      
      const result = await sendCustomerToCRM(testData);
      
      if (result.success) {
        toast({
          title: "CRM Test Successful",
          description: "Customer data was sent to CRM successfully!",
        });
        console.log('✅ CRM test successful:', result);
      } else {
        toast({
          title: "CRM Test Failed",
          description: `Error: ${result.error}`,
          variant: "destructive"
        });
        console.error('❌ CRM test failed:', result);
      }
    } catch (error) {
      toast({
        title: "CRM Test Error",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
      console.error('💥 CRM test error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">CRM Integration Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Test the CRM integration by sending sample customer data to your CRM application.
        </p>
        <Button 
          onClick={handleTestCRM} 
          disabled={isTesting}
          variant="outline"
          className="w-full"
        >
          {isTesting ? 'Testing...' : 'Test CRM Integration'}
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          Check the browser console for detailed logs.
        </p>
      </CardContent>
    </Card>
  );
};

export default CRMTestButton; 
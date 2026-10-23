import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sendNewCustomerToCRM } from '@/services/crmService';
import { useToast } from '@/hooks/use-toast';

const NewCustomerCRMTestButton: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const handleTestNewCustomerCRM = async () => {
    setIsTesting(true);
    
    try {
      const testData = {
        customerName: 'Jane Doe',
        customerEmail: 'jane.doe@example.com',
        customerPhone: '+44 20 7946 0959',
        businessId: '24e2799f-60d5-4e3b-bb30-b8049c9ae56d', // Amici Coffee business ID
        customerId: 'test-customer-' + Date.now(),
        externalId: 'ext-' + Date.now(),
        dateOfBirth: '1990-01-15',
        preferences: {
          dietary_restrictions: 'vegetarian',
          preferred_seating: 'window'
        }
      };

      console.log('🧪 Testing new customer CRM integration:', testData);
      
      const result = await sendNewCustomerToCRM(testData);
      
      if (result.success) {
        toast({
          title: "New Customer CRM Test Successful",
          description: "New customer data was sent to CRM successfully!",
        });
        console.log('✅ New customer CRM test successful:', result);
      } else {
        toast({
          title: "New Customer CRM Test Failed",
          description: `Error: ${result.error}`,
          variant: "destructive"
        });
        console.error('❌ New customer CRM test failed:', result);
      }
    } catch (error) {
      toast({
        title: "New Customer CRM Test Error",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
      console.error('💥 New customer CRM test error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">New Customer CRM Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Test sending new customer data to CRM (without booking).
        </p>
        <Button 
          onClick={handleTestNewCustomerCRM} 
          disabled={isTesting}
          variant="outline"
          className="w-full"
        >
          {isTesting ? 'Testing...' : 'Test New Customer CRM'}
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          This simulates a new customer being created in the customers table.
        </p>
      </CardContent>
    </Card>
  );
};

export default NewCustomerCRMTestButton; 
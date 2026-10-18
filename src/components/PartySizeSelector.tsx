
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface PartySizeSelectorProps {
  selectedSize?: number;
  onSizeSelect: (size: number) => void;
}

const PartySizeSelector: React.FC<PartySizeSelectorProps> = ({ selectedSize, onSizeSelect }) => {
  const partySizes = [
    { size: 1, label: '1 Person', tableType: 'Small table (seats 2)' },
    { size: 2, label: '2 People', tableType: 'Small table (seats 2)' },
    { size: 3, label: '3 People', tableType: 'Medium table (seats 4)' },
    { size: 4, label: '4 People', tableType: 'Medium table (seats 4)' },
    { size: 5, label: '5 People', tableType: 'Large table (seats 6)' },
    { size: 6, label: '6 People', tableType: 'Large table (seats 6)' },
    { size: 7, label: '7 People', tableType: 'Large table (seats 6)' },
    { size: 8, label: '8 People', tableType: 'Large table (seats 6)' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600 mb-6">
          How many people will be joining you?
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {partySizes.map(({ size, label, tableType }) => (
          <Button
            key={size}
            variant={selectedSize === size ? 'default' : 'outline'}
            className={`
              h-auto p-4 flex flex-col items-center space-y-2
              ${selectedSize === size ? 'bg-amber-600 hover:bg-amber-700' : 'hover:bg-amber-50'}
            `}
            onClick={() => onSizeSelect(size)}
          >
            <Users className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">{label}</div>
            </div>
          </Button>
        ))}
      </div>

      {selectedSize && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-center">
            <p className="text-amber-800 font-medium">
              Party of {selectedSize} - {partySizes.find(p => p.size === selectedSize)?.tableType}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-gray-500 text-center space-y-1">
        <p>• Tables are assigned based on party size</p>
        <p>• We accommodate up to 8 people per reservation</p>
        <p>• For larger groups, please call us directly</p>
      </div>
    </div>
  );
};

export default PartySizeSelector;

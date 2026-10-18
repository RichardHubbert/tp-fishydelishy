
import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TableSizesSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Perfect Tables for Every Occasion
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From intimate dinners to family gatherings, we have the perfect table waiting for you.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle>Intimate Tables</CardTitle>
              <CardDescription>Perfect for 2 people</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Cozy window-side tables with beautiful city views.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle>Family Tables</CardTitle>
              <CardDescription>Comfortable for 4 people</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Spacious center tables ideal for families and friends.</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle>Group Tables</CardTitle>
              <CardDescription>Spacious for 6 people</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Large patio tables for celebrations and gatherings.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default TableSizesSection;

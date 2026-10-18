import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Clock, Star } from 'lucide-react';
import { siteConfig, replaceTokens } from '@/config/site';

interface HeroSectionProps {
  onBookTable: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onBookTable }) => {
  const { business, branding, features } = siteConfig;
  const { primary, primaryShade, hover, background, backgroundShade } = branding.colors;
  
  return (
    <section className={`relative bg-gradient-to-br from-${primary}-50 to-${background}-${backgroundShade} py-20`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {features.hero.welcome}{' '}
            <span className={`text-${primary}-${primaryShade}`}>{business.name}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {features.hero.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              onClick={onBookTable}
              size="lg" 
              className={`bg-${primary}-${primaryShade} hover:bg-${primary}-${hover} text-white px-8 py-3 text-lg`}
            >
              {features.hero.ctaText}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {features.cards.map((card, index) => {
              const IconComponent = card.icon === 'Calendar' ? Calendar 
                : card.icon === 'Users' ? Users 
                : card.icon === 'Clock' ? Clock 
                : Star;
              
              return (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <IconComponent className={`h-8 w-8 text-${primary}-${primaryShade} mx-auto mb-2`} />
                    <h3 className="font-semibold text-gray-900">{card.title}</h3>
                    <p className="text-sm text-gray-600">{card.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

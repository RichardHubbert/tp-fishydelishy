import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Clock, Star } from 'lucide-react';
import { siteConfig, replaceTokens } from '@/config/site';

interface HeroSectionProps {
  onBookTable: () => void;
  restaurantName?: string;
  imageUrl?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onBookTable, restaurantName = siteConfig.business.name, imageUrl }) => {
  const { business, branding, features } = siteConfig;
  const { primary, primaryShade, hover, background, backgroundShade, light } = branding.colors;
  const hasImage = Boolean(imageUrl);
  const bgGradient = `bg-gradient-to-br from-${primary}-50 to-${background}-${backgroundShade}`;
  
  return (
    <section className={`relative overflow-hidden py-20 ${hasImage ? 'min-h-[32rem]' : bgGradient}`}>
      {hasImage && (
        <>
          <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/65" />
        </>
      )}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${hasImage ? 'text-white' : 'text-gray-900'}`}>
            {features.hero.welcome}{' '}
            <span className={hasImage ? `text-${primary}-${light || primaryShade}` : `text-${primary}-${primaryShade}`}>{restaurantName}</span>
          </h1>
          <p className={`text-xl mb-8 max-w-3xl mx-auto ${hasImage ? 'text-white/90' : 'text-gray-600'}`}>
            {replaceTokens(features.hero.subtitle, { name: restaurantName })}
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
              const IconComponent = { Calendar, Users, Clock, Star }[card.icon as keyof typeof import('lucide-react')];
              return (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    {IconComponent && <IconComponent className={`h-8 w-8 text-${primary}-${primaryShade} mx-auto mb-2`} />}
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

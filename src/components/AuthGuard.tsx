import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, UserPlus } from 'lucide-react';
import { siteConfig } from '@/config/site';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const { business, branding } = siteConfig;
  const { primary, primaryShade, hover, background, backgroundShade } = branding.colors;

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-${primary}-50 to-${background}-${backgroundShade} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-${primary}-${primaryShade} mx-auto mb-4`}></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-${primary}-50 to-${background}-${backgroundShade} flex items-center justify-center p-4`}>
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Authentication Required
            </CardTitle>
            <CardDescription className="text-gray-600">
              Please sign in to make a reservation at {business.name}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button 
              className={`w-full bg-${primary}-${primaryShade} hover:bg-${primary}-${hover}`}
              onClick={() => window.location.href = '/auth'}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
            
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/auth'}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Create Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;

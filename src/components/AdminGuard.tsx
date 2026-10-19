import React from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Home } from 'lucide-react';
import { siteConfig } from '@/config/site';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const { isAdmin, user, isLoading } = useAdmin();
  const { business, branding } = siteConfig;
  const { primary, primaryShade, hover, background, backgroundShade } = branding.colors;

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-${primary}-50 to-${background}-${backgroundShade} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-${primary}-${primaryShade} mx-auto mb-4`}></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-${primary}-50 to-${background}-${backgroundShade} flex items-center justify-center p-4`}>
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-2">
            <Shield className={`mx-auto h-12 w-12 text-${primary}-${primaryShade}`} />
            <CardTitle className="text-2xl font-bold text-gray-900">
              Authentication Required
            </CardTitle>
            <CardDescription className="text-gray-600">
              Please sign in to access the admin dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button 
              className={`w-full bg-${primary}-${primaryShade} hover:bg-${primary}-${hover}`}
              onClick={() => window.location.href = '/auth'}
            >
              Sign In
            </Button>
            
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-${primary}-50 to-${background}-${backgroundShade} flex items-center justify-center p-4`}>
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-2">
            <Shield className={`mx-auto h-12 w-12 text-red-500`} />
            <CardTitle className="text-2xl font-bold text-gray-900">
              Access Denied
            </CardTitle>
            <CardDescription className="text-gray-600">
              You do not have permission to access the admin dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;

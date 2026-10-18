import React from 'react';
import { Menu, X, Calendar, LogOut, User, Home, Info, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { siteConfig } from '@/config/site';

interface MobileMenuProps {
  onBookingClick?: () => void;
}

const MobileMenu = ({ onBookingClick }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { business } = siteConfig;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      navigate('/');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBookingClick = () => {
    if (onBookingClick) {
      onBookingClick();
      setIsOpen(false);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="md:hidden relative">
      {/* Hamburger Button */}
      <Button 
        variant="ghost" 
        size="icon"
        className="w-10 h-10 text-white bg-black/20 hover:bg-black/40 cursor-pointer rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white shadow-lg">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-gray-800 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <nav className="flex flex-col space-y-6">
              <Button 
                variant="ghost" 
                className="flex items-center text-lg text-gray-800 hover:bg-gray-100 w-full justify-start px-4"
                onClick={() => handleNavigation('/')}
              >
                <Home className="mr-3 h-5 w-5" />
                Home
              </Button>
              
              <Button 
                variant="ghost" 
                className="flex items-center text-lg text-gray-800 hover:bg-gray-100 w-full justify-start px-4"
                onClick={handleBookingClick}
              >
                <Calendar className="mr-3 h-5 w-5" />
                Reserve Table
              </Button>
              
              <Button 
                variant="ghost" 
                className="flex items-center text-lg text-gray-800 hover:bg-gray-100 w-full justify-start px-4"
                onClick={() => handleNavigation('/menu')}
              >
                <Coffee className="mr-3 h-5 w-5" />
                View Menu
              </Button>
              
              <Button 
                variant="ghost" 
                className="flex items-center text-lg text-gray-800 hover:bg-gray-100 w-full justify-start px-4"
                onClick={() => handleNavigation('/about')}
              >
                <Info className="mr-3 h-5 w-5" />
                About Us
              </Button>
              
              {user ? (
                <>
                  <Button 
                    variant="ghost" 
                    className="flex items-center text-lg text-gray-800 hover:bg-gray-100 w-full justify-start px-4"
                    onClick={() => handleNavigation('/admin')}
                  >
                    <User className="mr-3 h-5 w-5" />
                    Admin Dashboard
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="flex items-center justify-start text-lg text-red-600"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button 
                  variant="ghost" 
                  className="flex items-center text-lg text-gray-800 hover:bg-gray-100 w-full justify-start px-4"
                  onClick={() => handleNavigation('/auth')}
                >
                  <User className="mr-3 h-5 w-5" />
                  Sign In
                </Button>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;

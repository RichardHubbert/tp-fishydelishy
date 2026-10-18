import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/useAdmin';
import { Restaurant, fetchAllRestaurants, deleteRestaurant, restoreRestaurant } from '@/services/restaurantService';
import RestaurantForm from '@/components/RestaurantForm';
import NavigationHeader from '@/components/NavigationHeader';

const RestaurantManagement: React.FC = () => {
  const { isAdmin, user } = useAdmin();
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | undefined>();
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadRestaurants();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterRestaurants();
  }, [restaurants, searchQuery, showInactive]);

  const loadRestaurants = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAllRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      toast({
        title: "Error",
        description: "Failed to load restaurants.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterRestaurants = () => {
    let filtered = restaurants;

    // Filter by active/inactive status
    if (!showInactive) {
      filtered = filtered.filter(r => r.is_active);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.cuisine.toLowerCase().includes(query) ||
        r.address.toLowerCase().includes(query)
      );
    }

    setFilteredRestaurants(filtered);
  };

  const handleDelete = async (restaurant: Restaurant) => {
    try {
      await deleteRestaurant(restaurant.id);
      toast({
        title: "Restaurant Deleted",
        description: `${restaurant.name} has been deleted.`,
      });
      loadRestaurants();
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast({
        title: "Error",
        description: "Failed to delete restaurant.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (restaurant: Restaurant) => {
    try {
      await restoreRestaurant(restaurant.id);
      toast({
        title: "Restaurant Restored",
        description: `${restaurant.name} has been restored.`,
      });
      loadRestaurants();
    } catch (error) {
      console.error('Error restoring restaurant:', error);
      toast({
        title: "Error",
        description: "Failed to restore restaurant.",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingRestaurant(undefined);
    loadRestaurants();
  };

  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingRestaurant(undefined);
    setShowForm(true);
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
              <p className="text-gray-600">
                You don't have permission to access this page. Only admin users can manage restaurants.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <RestaurantForm
          restaurant={editingRestaurant}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  return (
    <>
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8 mt-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Restaurant Management</h1>
            <p className="text-gray-600 mt-2">
              Manage all restaurants in the system. Only visible to admin users.
            </p>
          </div>
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Restaurant
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search restaurants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowInactive(!showInactive)}
                className="flex items-center gap-2"
              >
                {showInactive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showInactive ? 'Hide Inactive' : 'Show Inactive'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Restaurants List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading restaurants...</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600">
                  {searchQuery ? 'No restaurants found matching your search.' : 'No restaurants found.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredRestaurants.map((restaurant) => (
              <Card key={restaurant.id} className={!restaurant.is_active ? 'opacity-60' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {restaurant.image_url && (
                        <img
                          src={restaurant.image_url}
                          alt={restaurant.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {restaurant.name}
                          </h3>
                          <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                            {restaurant.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {restaurant.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-medium">{restaurant.rating}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Cuisine:</strong> {restaurant.cuisine}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Address:</strong> {restaurant.address}
                        </p>
                        {restaurant.phone && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Phone:</strong> {restaurant.phone}
                          </p>
                        )}
                        {restaurant.email && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Email:</strong> {restaurant.email}
                          </p>
                        )}
                        {restaurant.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {restaurant.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(restaurant)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {restaurant.is_active ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Restaurant</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{restaurant.name}"? This action can be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(restaurant)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(restaurant)}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default RestaurantManagement; 
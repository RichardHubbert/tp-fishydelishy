import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Restaurant, RestaurantCategory, createRestaurant, fetchRestaurantCategories, updateRestaurant } from '@/services/restaurantService';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface RestaurantFormProps {
  restaurant?: Restaurant;
  onSuccess: () => void;
  onCancel: () => void;
}

const RestaurantForm: React.FC<RestaurantFormProps> = ({
  restaurant,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<RestaurantCategory[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    cuisine: '',
    category_id: '',
    rating: '',
    image_url: '',
    phone: '',
    email: '',
    description: '',
    is_active: true,
    is_default: false,
    county: '',
  });

  const isEditing = !!restaurant;

  useEffect(() => {
    fetchRestaurantCategories()
      .then(setCategories)
      .catch((error) => console.error('Error loading categories:', error));
  }, []);

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        address: restaurant.address || '',
        cuisine: restaurant.cuisine || '',
        category_id: restaurant.category_id || '',
        rating: restaurant.rating?.toString() || '',
        image_url: restaurant.image_url || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        description: restaurant.description || '',
        is_active: restaurant.is_active ?? true,
        is_default: restaurant.is_default ?? false,
        county: restaurant.county || '',
      });
      if (restaurant.image_url) {
        setImagePreview(restaurant.image_url);
      }
    }
  }, [restaurant]);

  const handleImageUpload = async (file: File): Promise<string> => {
    console.log('🚀 Starting image upload...');
    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `restaurant-images/${fileName}`;

    console.log('📂 Upload path:', filePath);

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 User auth status:', user ? 'Authenticated' : 'Not authenticated');

    // Upload the file
    const { error: uploadError, data } = await supabase.storage
      .from('restaurants')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload error details:', {
        message: uploadError.message,
        name: uploadError.name
      });
      throw uploadError;
    }

    console.log('✅ Upload successful:', data);

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('restaurants')
      .getPublicUrl(filePath);

    console.log('🔗 Public URL:', publicUrl);
    return publicUrl;
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsUploading(true);

    try {
      let imageUrl = formData.image_url;

      // Upload new image if selected
      if (imageFile) {
        try {
          imageUrl = await handleImageUpload(imageFile);
        } catch (error) {
          console.error('Error uploading image:', error);
          toast({
            title: "Upload Failed",
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }
      }

      const selectedCategory = categories.find((category) => category.id === formData.category_id);
      const restaurantData = {
        ...formData,
        category_id: formData.category_id || null,
        cuisine: selectedCategory?.name || formData.cuisine,
        county: formData.county || null,
        image_url: imageUrl,
        rating: formData.rating ? parseFloat(formData.rating) : null
      };

      if (isEditing && restaurant) {
        await updateRestaurant(restaurant.id, restaurantData);
        toast({
          title: "Restaurant Updated",
          description: "Restaurant has been updated successfully.",
        });
      } else {
        await createRestaurant(restaurantData);
        toast({
          title: "Restaurant Created",
          description: "Restaurant has been created successfully.",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast({
        title: "Error",
        description: "Failed to save restaurant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit details' : 'Add New Restaurant'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter restaurant name"
                required
              />
            </div>

          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter full address"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating (0-5)</Label>
              <Input
                id="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => handleInputChange('rating', e.target.value)}
                placeholder="4.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+44 20 7946 0958"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@restaurant.com"
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>Restaurant Image</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                imagePreview 
                  ? 'border-gray-300 bg-gray-50' 
                  : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Restaurant preview"
                    className="max-h-48 mx-auto rounded-lg shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">
                      Drag and drop an image here, or{' '}
                      <label className="text-amber-600 hover:text-amber-700 cursor-pointer">
                        browse
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter restaurant description..."
              rows={3}
            />
          </div>


          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isUploading}>
              {isLoading || isUploading ? 'Saving...' : (isEditing ? 'Update Restaurant' : 'Create Restaurant')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RestaurantForm; 
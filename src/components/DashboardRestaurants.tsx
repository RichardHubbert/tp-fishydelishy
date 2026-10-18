import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import RestaurantForm from '@/components/RestaurantForm';
import {
  Restaurant,
  fetchAllRestaurants,
  updateRestaurant,
  uploadRestaurantImage,
} from '@/services/restaurantService';

const DashboardRestaurants = () => {
  const { toast } = useToast();
  const [restaurant, setRestaurant] = useState<Restaurant | undefined>();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [agentEnabled, setAgentEnabled] = useState(false);
  const [agentId, setAgentId] = useState('');
  const [agentSaving, setAgentSaving] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      const restaurantData = await fetchAllRestaurants();
      setRestaurant(restaurantData.find((item) => item.is_default) || restaurantData[0]);
    } catch (error) {
      console.error('Error loading restaurant manager:', error);
      toast({
        title: 'Could not load restaurants',
        description: error instanceof Error ? error.message : 'Check the database connection.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setAgentEnabled(Boolean(restaurant?.elevenlabs_enabled));
    setAgentId(restaurant?.elevenlabs_agent_id || '');
  }, [restaurant?.id, restaurant?.elevenlabs_enabled, restaurant?.elevenlabs_agent_id]);

  const handleSaveAgent = async () => {
    if (!restaurant) return;
    const trimmedId = agentId.trim();
    if (agentEnabled && !/^[A-Za-z0-9_-]{6,128}$/.test(trimmedId)) {
      toast({
        title: 'Agent ID needed',
        description: 'Paste the ElevenLabs agent ID, for example agent_abc123.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAgentSaving(true);
      await updateRestaurant(restaurant.id, {
        elevenlabs_enabled: agentEnabled && Boolean(trimmedId),
        elevenlabs_agent_id: trimmedId || null,
      });
      toast({
        title: agentEnabled ? 'Voice agent enabled' : 'Voice agent turned off',
        description: agentEnabled
          ? 'The widget will appear on the public booking page.'
          : 'The public booking page will no longer show the widget.',
      });
      await load();
    } catch (error) {
      const description = error instanceof Error
        ? error.message
        : error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Try again.';
      toast({
        title: 'Could not save the agent',
        description,
        variant: 'destructive',
      });
    } finally {
      setAgentSaving(false);
    }
  };
  const handleHeroFile = async (file: File) => {
    if (!restaurant) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Choose an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image must be smaller than 5MB', variant: 'destructive' });
      return;
    }

    try {
      setHeroUploading(true);
      const imageUrl = await uploadRestaurantImage(file, 'hero-images');
      await updateRestaurant(restaurant.id, { hero_image_url: imageUrl });
      toast({ title: 'Hero image updated', description: 'The homepage welcome section now uses this image.' });
      await load();
    } catch (error) {
      toast({
        title: 'Could not upload hero image',
        description: error instanceof Error ? error.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setHeroUploading(false);
      if (heroInputRef.current) heroInputRef.current.value = '';
    }
  };

  const handleRemoveHero = async () => {
    if (!restaurant) return;
    try {
      setHeroUploading(true);
      await updateRestaurant(restaurant.id, { hero_image_url: null });
      toast({ title: 'Hero image removed' });
      await load();
    } catch (error) {
      toast({
        title: 'Could not remove hero image',
        description: error instanceof Error ? error.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setHeroUploading(false);
    }
  };

  if (showForm && restaurant) {
    return (
      <RestaurantForm
        restaurant={restaurant}
        onSuccess={() => {
          setShowForm(false);
          load();
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{restaurant?.name || 'Restaurant'}</CardTitle>
            <CardDescription>
              Update the details, homepage image, and voice agent for this restaurant.
            </CardDescription>
          </div>
          <Button type="button" disabled={!restaurant} onClick={() => setShowForm(true)}>
            Edit details
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && <p className="text-gray-600">Loading restaurant...</p>}
        {restaurant?.address && (
          <p className="text-sm text-gray-600">{restaurant.address}</p>
        )}
        <div className="rounded-lg border bg-amber-50 p-4">
          <p className="text-sm font-medium text-gray-900">Hero image</p>
          <p className="mb-3 text-sm text-gray-600">
            This image sits behind the welcome message on the homepage.
          </p>
          {restaurant?.hero_image_url && (
            <img
              src={restaurant.hero_image_url}
              alt=""
              className="mb-3 h-40 w-full max-w-xl rounded-lg object-cover"
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!restaurant || heroUploading}
              onClick={() => heroInputRef.current?.click()}
            >
              {heroUploading ? 'Saving...' : restaurant?.hero_image_url ? 'Replace image' : 'Add image'}
            </Button>
            {restaurant?.hero_image_url && (
              <Button type="button" variant="outline" disabled={heroUploading} onClick={handleRemoveHero}>
                Remove
              </Button>
            )}
          </div>
          <input
            ref={heroInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleHeroFile(file);
            }}
          />
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">ElevenLabs agent</p>
              <p className="mt-1 text-sm text-gray-600">
                Show a voice widget on the public booking page.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="elevenlabs-enabled" className="text-sm text-gray-700">
                {agentEnabled ? 'On' : 'Off'}
              </Label>
              <Switch
                id="elevenlabs-enabled"
                checked={agentEnabled}
                disabled={!restaurant || agentSaving}
                onCheckedChange={setAgentEnabled}
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="elevenlabs-agent-id">Agent ID</Label>
            <Input
              id="elevenlabs-agent-id"
              value={agentId}
              disabled={!restaurant || agentSaving}
              placeholder="agent_..."
              onChange={(event) => setAgentId(event.target.value)}
            />
            <p className="text-sm text-gray-600">
              Paste the agent ID from ElevenLabs. The agent needs to be public, with authentication turned off.
            </p>
          </div>
          <Button
            type="button"
            className="mt-4"
            disabled={!restaurant || agentSaving}
            onClick={handleSaveAgent}
          >
            {agentSaving ? 'Saving...' : 'Save agent'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardRestaurants;

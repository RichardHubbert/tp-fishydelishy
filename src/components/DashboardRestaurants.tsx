import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import RestaurantForm from '@/components/RestaurantForm';
import {
  Restaurant,
  fetchAllRestaurants,
  updateRestaurant,
  uploadRestaurantImage,
} from '@/services/restaurantService';
import { siteConfig } from '@/config/site';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  DAY_LABELS,
  WEEK_ORDER,
  parseOpeningHours,
  rememberOpeningHours,
  type DayKey,
  type OpeningHours,
} from '@/lib/openingHours';

const DashboardRestaurants = () => {
  const { toast } = useToast();
  const [restaurant, setRestaurant] = useState<Restaurant | undefined>();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroUrl, setHeroUrl] = useState('');
  const [heroUrlSaving, setHeroUrlSaving] = useState(false);
  const [agentEnabled, setAgentEnabled] = useState(false);
  const [agentId, setAgentId] = useState('');
  const [agentSaving, setAgentSaving] = useState(false);
  const [hours, setHours] = useState<OpeningHours>(() => parseOpeningHours(null));
  const [hoursSaving, setHoursSaving] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      const restaurantData = await fetchAllRestaurants();
      const configuredId = siteConfig.business.restaurantId;
      const next = restaurantData.find((item) => item.id === configuredId) ||
        restaurantData.find((item) => item.is_default) ||
        restaurantData[0];
      setRestaurant(next);
      if (next) rememberOpeningHours(next.opening_hours);
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
    setHeroUrl(restaurant?.hero_image_url || '');
    const nextHours = parseOpeningHours(restaurant?.opening_hours);
    setHours(nextHours);
    rememberOpeningHours(nextHours);
  }, [restaurant?.id, restaurant?.elevenlabs_enabled, restaurant?.elevenlabs_agent_id, restaurant?.hero_image_url, restaurant?.opening_hours]);

  const updateDay = (day: DayKey, patch: Partial<OpeningHours[DayKey]>) => {
    setHours((current) => ({ ...current, [day]: { ...current[day], ...patch } }));
  };

  const handleSaveHours = async () => {
    if (!restaurant) return;
    if (WEEK_ORDER.every((day) => hours[day].closed)) {
      toast({ title: 'Keep at least one day open', variant: 'destructive' });
      return;
    }
    const invalid = WEEK_ORDER.find((day) => !hours[day].closed && hours[day].open >= hours[day].close);
    if (invalid) {
      toast({
        title: `${DAY_LABELS[invalid]} closes before it opens`,
        description: 'The last booking needs to be after the opening time.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setHoursSaving(true);
      await updateRestaurant(restaurant.id, { opening_hours: hours });
      rememberOpeningHours(hours);
      const closed = WEEK_ORDER.filter((day) => hours[day].closed).map((day) => DAY_LABELS[day]);
      toast({
        title: 'Booking hours saved',
        description: closed.length ? `Closed: ${closed.join(', ')}` : 'Open every day.',
      });
      await load();
    } catch (error) {
      toast({
        title: 'Could not save booking hours',
        description: error instanceof Error ? error.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setHoursSaving(false);
    }
  };

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

  const handleSaveHeroUrl = async () => {
    if (!restaurant) return;
    const trimmed = heroUrl.trim();
    if (!trimmed) {
      toast({ title: 'Image URL needed', description: 'Paste a link to the hero image.', variant: 'destructive' });
      return;
    }
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      toast({ title: 'That is not a valid URL', description: 'Use a full link starting with https://', variant: 'destructive' });
      return;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      toast({ title: 'That is not a valid URL', description: 'Use a full link starting with https://', variant: 'destructive' });
      return;
    }

    try {
      setHeroUrlSaving(true);
      await updateRestaurant(restaurant.id, { hero_image_url: trimmed });
      toast({ title: 'Hero image updated', description: 'The homepage welcome section now uses this image.' });
      await load();
    } catch (error) {
      toast({
        title: 'Could not save the hero image',
        description: error instanceof Error ? error.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setHeroUrlSaving(false);
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

  const embedCode = restaurant
    ? `<script src="${siteConfig.urls.productionUrl}widget/tp-core-card.js"></script>\n<tp-core-card restaurant-id="${restaurant.id}"></tp-core-card>`
    : '';

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      toast({ title: 'Embed code copied' });
    } catch {
      toast({
        title: 'Could not copy',
        description: 'Select the code and copy it manually.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{restaurant?.name || siteConfig.business.name}</CardTitle>
            <CardDescription>
              Update the details, booking hours, homepage image, voice agent, and booking card embed code.
            </CardDescription>
          </div>
          <Button type="button" disabled={!restaurant} onClick={() => setShowForm(true)}>
            Edit details
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && <p className="text-gray-600">Loading restaurant...</p>}
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium text-gray-900">Booking hours</p>
          <p className="mb-4 text-sm text-gray-600">
            Choose which days take bookings, and the opening time and last booking for each open day.
          </p>
          <div className="space-y-3">
            {WEEK_ORDER.map((day) => (
              <div key={day} className="grid gap-2 rounded-lg border border-gray-100 p-3 sm:grid-cols-[7rem_1fr]">
                <p className="text-sm font-medium text-gray-900">{DAY_LABELS[day]}</p>
                <div className="space-y-2">
                  <RadioGroup
                    value={hours[day].closed ? 'closed' : 'open'}
                    onValueChange={(value) => updateDay(day, { closed: value === 'closed' })}
                    className="flex gap-4"
                  >
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <RadioGroupItem value="open" id={`${day}-open`} />
                      Open
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <RadioGroupItem value="closed" id={`${day}-closed`} />
                      Closed
                    </label>
                  </RadioGroup>
                  {!hours[day].closed && (
                    <div className="flex flex-wrap gap-3">
                      <label className="text-xs text-gray-500">
                        Opens
                        <input
                          type="time"
                          value={hours[day].open}
                          onChange={(event) => updateDay(day, { open: event.target.value })}
                          className="mt-1 block rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-900"
                        />
                      </label>
                      <label className="text-xs text-gray-500">
                        Last booking
                        <input
                          type="time"
                          value={hours[day].close}
                          onChange={(event) => updateDay(day, { close: event.target.value })}
                          className="mt-1 block rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-900"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button type="button" className="mt-4" disabled={!restaurant || hoursSaving} onClick={handleSaveHours}>
            {hoursSaving ? 'Saving...' : 'Save hours'}
          </Button>
        </div>
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
          <div className="mb-3 max-w-xl space-y-2">
            <Label htmlFor="hero-image-url">Image URL</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="hero-image-url"
                type="url"
                placeholder="https://example.com/hero.jpg"
                value={heroUrl}
                disabled={!restaurant || heroUploading || heroUrlSaving}
                onChange={(event) => setHeroUrl(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!restaurant || heroUploading || heroUrlSaving}
                onClick={handleSaveHeroUrl}
              >
                {heroUrlSaving ? 'Saving...' : 'Use URL'}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!restaurant || heroUploading || heroUrlSaving}
              onClick={() => heroInputRef.current?.click()}
            >
              {heroUploading ? 'Saving...' : restaurant?.hero_image_url ? 'Replace image' : 'Add image'}
            </Button>
            {restaurant?.hero_image_url && (
              <Button type="button" variant="outline" disabled={heroUploading || heroUrlSaving} onClick={handleRemoveHero}>
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

        {restaurant && (
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-gray-900">Booking card embed code</p>
            <p className="mt-1 mb-3 text-sm text-gray-600">
              Paste this into the directory or another site. It shows the booking card for {restaurant.name}.
            </p>
            <Label htmlFor="booking-card-embed" className="sr-only">Booking card embed code</Label>
            <Textarea
              id="booking-card-embed"
              readOnly
              rows={3}
              className="font-mono text-xs"
              value={embedCode}
            />
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={copyEmbedCode}
            >
              Copy code
            </Button>
          </div>
        )}

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

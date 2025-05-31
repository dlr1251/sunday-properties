'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Re-using the Property type, ensure it matches your actual structure
// If it's defined elsewhere and exported, import it instead.
type Property = {
  id: string;
  title: string;
  type: string;
  price: number;
  currency: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  user_id: string; // Property owner's ID
};

export default function MyFavoritesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([]);
  // This set is to manage the filled state of hearts, 
  // though on this page all initially shown properties are favorites.
  const [favoritedPropertyIds, setFavoritedPropertyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      if (!user) {
        setLoading(false); // No user, so nothing to load
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!userId) {
      // If userId becomes null (e.g., logout), clear properties and stop loading
      if (!loading && favoriteProperties.length > 0) setFavoriteProperties([]);
      if (!loading && favoritedPropertyIds.size > 0) setFavoritedPropertyIds(new Set());
      // if userId is null from the start, loading is handled by getCurrentUser effect
      return;
    }

    const fetchFavoriteProperties = async () => {
      setLoading(true);
      // 1. Get favorite property IDs
      const { data: favIdsData, error: favIdsError } = await supabase
        .from('user_favorites')
        .select('property_id')
        .eq('user_id', userId);

      if (favIdsError) {
        console.error('Error fetching favorite IDs:', favIdsError);
        toast.error('Could not load your favorite property IDs.');
        setLoading(false);
        return;
      }

      if (!favIdsData || favIdsData.length === 0) {
        setFavoriteProperties([]);
        setFavoritedPropertyIds(new Set());
        setLoading(false);
        return;
      }

      const propertyIds = favIdsData.map(fav => fav.property_id);
      setFavoritedPropertyIds(new Set(propertyIds)); // Initialize all as favorited for heart icon state

      // 2. Get property details for those IDs
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .in('id', propertyIds);

      if (propertiesError) {
        console.error('Error fetching favorite properties details:', propertiesError);
        toast.error('Could not load details for your favorite properties.');
      } else {
        setFavoriteProperties(propertiesData || []);
      }
      setLoading(false);
    };

    fetchFavoriteProperties();
  }, [userId]); // Re-run when userId changes

  const toggleFavorite = async (propertyId: string) => {
    if (!userId) {
      toast.error('Please log in.');
      return;
    }

    const isCurrentlyFavorited = favoritedPropertyIds.has(propertyId);

    if (isCurrentlyFavorited) {
      // Remove from favorites
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .match({ user_id: userId, property_id: propertyId });

      if (error) {
        console.error('Error removing favorite:', error);
        toast.error('Could not remove from favorites.');
      } else {
        // Update local state for UI responsiveness
        setFavoritedPropertyIds(prev => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });
        setFavoriteProperties(prevProps => prevProps.filter(p => p.id !== propertyId));
        toast.success('Removed from favorites!');
      }
    } else {
      // This case should ideally not happen on this page if a property is already displayed
      // But, as a robust toggle, we can include adding it back.
      const { error } = await supabase
        .from('user_favorites')
        .insert([{ user_id: userId, property_id: propertyId }]);
      if (error) {
        console.error('Error adding favorite:', error);
        toast.error('Could not add to favorites.');
      } else {
        setFavoritedPropertyIds(prev => new Set(prev).add(propertyId));
        // Re-fetch or add to favoriteProperties if necessary, though this implies an inconsistency
        toast.success('Added to favorites!');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4 text-lg">Loading your favorite properties...</p>
      </div>
    );
  }

  if (!userId) {
     return (
      <div className="p-6 text-center">
        <p className="text-lg">Please log in to see your favorite properties.</p>
        <Button onClick={() => router.push('/login')} className="mt-4">Go to Login</Button>
      </div>
    );
  }

  if (favoriteProperties.length === 0) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">My Favorite Properties</h1>
        <p className="text-lg">You haven't favorited any properties yet.</p>
        <Button onClick={() => router.push('/search')} className="mt-4">Find Properties</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Favorite Properties</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favoriteProperties.map((property) => {
          const isOwned = userId === property.user_id;
          // On this page, isFavorited is always true for displayed items initially.
          // The favoritedPropertyIds set tracks the live state for the heart icon.
          const isFavorited = favoritedPropertyIds.has(property.id);

          return (
            <Card key={property.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className={`${isOwned ? 'text-orange-500' : ''} break-words`}>
                  {property.title}
                </CardTitle>
                {isOwned && (
                  <p className="text-xs text-orange-600 font-medium">Owned by you</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-muted-foreground">{property.type}</p>
                      <p className="font-medium">{property.address}, {property.city}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleFavorite(property.id)} 
                      title={isFavorited ? "Remove from favorites" : "Add to favorites"} 
                    >
                      <Heart className={`h-5 w-5 ${isFavorited ? 'text-red-500 fill-red-500' : 'text-gray-500'}`} />
                    </Button>
                  </div>
                  <p className="text-lg font-bold">{property.currency} {property.price.toLocaleString()}</p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <p>{property.bedrooms} dormitorios</p>
                    <p>{property.bathrooms} baños</p>
                    <p>{property.area}m²</p>
                  </div>
                  <p className="text-sm line-clamp-3 mt-1">{property.description}</p>
                </div>
                <Button onClick={() => router.push(`/property/${property.id}`)} className="mt-4 w-full">
                  Ver Detalles
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 
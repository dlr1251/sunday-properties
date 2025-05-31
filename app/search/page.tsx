'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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
  user_id: string;
};

export default function Search() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number | undefined]>([0, undefined]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showMyProperties, setShowMyProperties] = useState(false);
  const [favoritedPropertyIds, setFavoritedPropertyIds] = useState<Set<string>>(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchFavorites = async () => {
      setLoadingFavorites(true);
      const { data, error } = await supabase
        .from('user_favorites')
        .select('property_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching favorites:', error);
        toast.error('Could not load your favorites.');
      } else {
        setFavoritedPropertyIds(new Set(data.map(fav => fav.property_id)));
      }
      setLoadingFavorites(false);
    };

    fetchFavorites();
  }, [userId]);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!userId && !showMyProperties) {
        // If user is not loaded yet and we are not explicitly showing all properties,
        // wait or fetch all non-owned (which might be tricky without user ID)
        // For now, let's fetch all if userId is null and showMyProperties is false,
        // or adjust based on exact desired behavior for non-logged-in users.
        // A simple approach: if no userId, don't filter by it.
      }

      let query = supabase.from('properties').select('*');

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }
      if (priceRange[0] > 0) {
        query = query.gte('price', priceRange[0]);
      }
      if (priceRange[1] !== undefined && priceRange[1] !== Infinity && priceRange[1] > 0) {
        query = query.lte('price', priceRange[1]);
      }

      if (userId && !showMyProperties) {
        query = query.neq('user_id', userId);
      }
      
      // If showMyProperties is true, we don't add any user_id filter, so it shows all including owned.
      // If you want *only* owned properties when toggled, it would be:
      // if (userId && showMyProperties) query = query.eq('user_id', userId);

      const { data, error } = await query;
      if (!error) {
        setProperties(data || []);
      } else {
        console.error("Error fetching properties:", error);
        setProperties([]);
      }
    };

    // Fetch properties when user ID is known or showMyProperties changes
    // or other filters change.
    // Adding userId to dependency array to refetch when it's loaded.
    fetchProperties();
  }, [search, priceRange, userId, showMyProperties]);

  const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.valueAsNumber;
    setPriceRange([val > 0 ? val : 0, priceRange[1]]);
  };

  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.valueAsNumber;
    setPriceRange([priceRange[0], val > 0 ? val : undefined]);
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!userId) {
      toast.error('Please log in to save favorites.');
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
        setFavoritedPropertyIds(prev => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });
        toast.success('Removed from favorites!');
      }
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('user_favorites')
        .insert([{ user_id: userId, property_id: propertyId }]);

      if (error) {
        console.error('Error adding favorite:', error);
        toast.error('Could not add to favorites.');
      } else {
        setFavoritedPropertyIds(prev => new Set(prev).add(propertyId));
        toast.success('Added to favorites!');
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Buscar Propiedades</h1>
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <Input
          placeholder="Buscar por título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Input
          type="number"
          placeholder="Precio mínimo"
          value={priceRange[0] > 0 ? priceRange[0] : ''}
          onChange={handlePriceMinChange}
          className="max-w-[150px]"
        />
        <Input
          type="number"
          placeholder="Precio máximo"
          value={priceRange[1] !== undefined && priceRange[1] > 0 ? priceRange[1] : ''}
          onChange={handlePriceMaxChange}
          className="max-w-[150px]"
        />
        <Button onClick={() => setShowMyProperties(!showMyProperties)} variant="outline">
          {showMyProperties ? 'Hide My Properties' : 'Show My Properties'}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.length === 0 && <p>No properties found matching your criteria.</p>}
        {properties.map((property) => {
          const isOwned = userId === property.user_id;
          const isFavorited = favoritedPropertyIds.has(property.id);
          return (
            <Card key={property.id}>
              <CardHeader>
                <CardTitle className={isOwned ? 'text-orange-500' : ''}>
                  {property.title}
                </CardTitle>
                {isOwned && <p className="text-xs text-orange-600 font-medium">Owned by you</p>}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">{property.type}</p>
                      <p className="font-medium">{property.address}, {property.city}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleFavorite(property.id)} 
                      title={isFavorited ? "Remove from favorites" : "Save as favorite"}
                      disabled={loadingFavorites}
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
                  <p className="line-clamp-2 text-sm">{property.description}</p>
                  <Link href={`/property/${encodeURIComponent(property.id)}`} className="w-full">
                    <Button className="mt-2 w-full">
                      Ver Detalles
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface Property {
  id: string;
  title: string;
}

interface Offer {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  created_at: string;
  property: Property;
}

interface RawOffer {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  created_at: string;
  property_id: string;
  properties: {
    id: string;
    title: string;
  } | null;
}

export default function Negotiations() {
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No user found');
          return;
        }

        const { data: rawOffers, error: offersError } = await supabase
          .from('offers')
          .select(`
            id,
            amount,
            currency,
            payment_method,
            status,
            created_at,
            property_id,
            properties (
              id,
              title
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (offersError) {
          console.error('Error fetching offers:', offersError);
          return;
        }

        // Transform the data to match our Offer type
        const transformedData = (rawOffers as unknown as RawOffer[]).map(offer => ({
          id: offer.id,
          amount: offer.amount,
          currency: offer.currency,
          payment_method: offer.payment_method,
          status: offer.status,
          created_at: offer.created_at,
          property: {
            id: offer.property_id,
            title: offer.properties?.title || 'Unknown Property'
          }
        }));

        setOffers(transformedData);
      } catch (error) {
        console.error('Error in fetchOffers:', error);
      }
    };

    fetchOffers();
  }, []);

  // Group offers by property
  const groupedOffers = offers.reduce((acc, offer) => {
    if (!acc[offer.property.id]) {
      acc[offer.property.id] = {
        property: offer.property,
        offers: []
      };
    }
    acc[offer.property.id].offers.push(offer);
    return acc;
  }, {} as Record<string, { property: Property; offers: Offer[] }>);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Negotiations</h1>
      
      {Object.entries(groupedOffers).map(([propertyId, { property, offers }]) => (
        <Card key={propertyId} className="mb-6">
          <CardHeader>
            <CardTitle>{property.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {offers.map(offer => (
              <div key={offer.id} className="border-b last:border-0 py-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">
                      {offer.amount.toLocaleString('es-CO', { 
                        style: 'currency', 
                        currency: offer.currency 
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {offer.payment_method}
                    </p>
                  </div>
                  <Badge variant={offer.status === 'accepted' ? 'default' : 'secondary'}>
                    {offer.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {Object.keys(groupedOffers).length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No negotiations found</p>
        </div>
      )}
    </div>
  );
}
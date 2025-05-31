'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Eye, Handshake, Loader2, Building, UserCheck, MessageSquare } from 'lucide-react'; // Changed UserVoice to MessageSquare
import Image from 'next/image';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Offer } from '../property/[id]/make-offer/page'; // Assuming Offer type is exported

interface Property {
  id: string;
  title: string;
  images: string[] | null; // Assuming images is an array of URLs
  user_id: string; // Property owner ID
}

interface EnrichedOffer extends Offer {
  properties: Property | null;
}

interface Deal {
  id: string;
  property_id: string;
  propertyTitle: string;
  propertyImage: string | null;
  propertyOwnerId: string;
  currentUserRole: 'Owner' | 'Offerer' | 'Owner & Offerer' | 'Unknown';
  offers: EnrichedOffer[];
  lastActivity: string; 
  offerSummary: { [key in Offer['status'] ]?: number };
}

export default function MyDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUserAndDeals = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error fetching user or user not logged in:', userError);
        setLoading(false);
        // Handle not logged in state if necessary, e.g., redirect or message
        return;
      }
      setCurrentUserId(user.id);

      // Fetch property IDs owned by the user
      const { data: ownedPropertyIdsData, error: ownedIdsError } = await supabase
        .from('properties')
        .select('id') // Only select id
        .eq('user_id', user.id);

      if (ownedIdsError) {
        console.error('Error fetching owned property IDs:', ownedIdsError);
        // Still attempt to fetch offers made by the user even if this fails
      }
      const ownedPropertyIds = ownedPropertyIdsData?.map(p => p.id) || [];

      const relevantStatuses: Offer['status'][] = ['pending_review', 'negotiating', 'accepted'];
      
      let orConditions = [`user_id.eq.${user.id}`]; // Offers made by the user
      if (ownedPropertyIds.length > 0) {
        orConditions.push(`property_id.in.(${ownedPropertyIds.join(',')})`); // Offers on properties owned by the user
      }
      
      const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select(`
          *,
          properties (id, title, images, user_id)
        `)
        .or(orConditions.join(',')) // Dynamically build OR condition
        .in('status', relevantStatuses)
        .order('created_at', { ascending: false });

      if (offersError) {
        console.error('Error fetching offers (raw object):', offersError);
        console.error('Error fetching offers (JSON.stringify):', JSON.stringify(offersError, null, 2));
        setLoading(false);
        return;
      }

      const enrichedOffers = (offersData || []) as EnrichedOffer[]; // Ensure offersData is not null
      
      const dealsMap = new Map<string, Deal>();

      enrichedOffers.forEach(offer => {
        if (!offer.properties || !offer.deal_id) return;

        const prop = offer.properties;
        let deal = dealsMap.get(offer.deal_id);

        if (!deal) {
          let role: Deal['currentUserRole'] = 'Unknown';
          const isOwner = prop.user_id === user.id;
          const hasMadeOfferOnThisProperty = enrichedOffers.some(o => o.user_id === user.id && o.property_id === prop.id);

          if (isOwner && hasMadeOfferOnThisProperty) role = 'Owner & Offerer';
          else if (isOwner) role = 'Owner';
          else if (hasMadeOfferOnThisProperty) role = 'Offerer';
          
          deal = {
            id: offer.deal_id,
            property_id: prop.id,
            propertyTitle: prop.title,
            propertyImage: prop.images && prop.images.length > 0 ? prop.images[0] : '/placeholder-image.png',
            propertyOwnerId: prop.user_id,
            currentUserRole: role,
            offers: [],
            lastActivity: offer.created_at, 
            offerSummary: {}
          };
        }

        if (deal) {
          deal.offers.push(offer);
          if (parseISO(offer.created_at) > parseISO(deal.lastActivity)) {
            deal.lastActivity = offer.created_at;
          }
          deal.offerSummary[offer.status] = (deal.offerSummary[offer.status] || 0) + 1;
          
          dealsMap.set(offer.deal_id, deal);
        }
      });

      setDeals(Array.from(dealsMap.values()));
      setLoading(false);
    };

    fetchCurrentUserAndDeals();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.16))]">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-lg">Loading your deals...</p>
      </div>
    );
  }

  if (!currentUserId) {
     return (
      <div className="container mx-auto p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to view your deals.</p>
            <Link href="/login">
              <Button className="mt-4">Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Handshake className="mr-3 h-7 w-7 text-primary"/>My Deals</CardTitle>
            <CardDescription>View and manage all your ongoing property negotiations here.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Building className="mx-auto h-16 w-16 text-gray-400 mb-4"/>
            <p className="text-lg text-gray-600 dark:text-gray-300">You currently have no active deals.</p>
            <p className="text-sm text-muted-foreground mt-2">Offers you make or receive will appear here.</p>
            <Link href="/search">
              <Button className="mt-6">Explore Properties</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleIcon = (role: Deal['currentUserRole']) => {
    switch (role) {
      case 'Owner':
        return <UserCheck className="mr-2 h-5 w-5 text-green-500" />;
      case 'Offerer':
        return <MessageSquare className="mr-2 h-5 w-5 text-blue-500" />;
      case 'Owner & Offerer': // Should be rare
        return <Handshake className="mr-2 h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: Offer['status']) => {
    switch (status) {
      case 'accepted':
        return 'default'; // Will style this with green bg
      case 'negotiating':
        return 'secondary';
      case 'pending_review':
        return 'outline';
      default:
        return 'default';
    }
  };
   const getStatusBadgeClassName = (status: Offer['status']) => {
    if (status === 'accepted') {
      return 'bg-green-500 hover:bg-green-600 text-white text-xs';
    }
    return 'text-xs';
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl"><Handshake className="mr-3 h-8 w-8 text-primary"/>My Deals</CardTitle>
          <CardDescription>Overview of your active property negotiations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Property</TableHead>
                <TableHead>Title & Role</TableHead>
                <TableHead>Offer Statuses</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <Link href={`/property/${encodeURIComponent(deal.property_id)}`}>
                      <div className="relative h-16 w-24 rounded-md overflow-hidden border">
                        <Image 
                          src={deal.propertyImage || '/placeholder-image.png'} 
                          alt={deal.propertyTitle} 
                          fill
                          style={{objectFit: "cover"}}
                          className="hover:opacity-90 transition-opacity"
                        />
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getRoleIcon(deal.currentUserRole)}
                      <div>
                        <Link href={`/property/${encodeURIComponent(deal.property_id)}`} className="font-medium hover:underline">
                          {deal.propertyTitle}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          Role: {deal.currentUserRole}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                        {Object.entries(deal.offerSummary).map(([status, count]) => (
                            <Badge 
                                key={status} 
                                variant={getStatusBadgeVariant(status as Offer['status'])} 
                                className={getStatusBadgeClassName(status as Offer['status'])}
                            >
                                {count} {status.replace('_', ' ')}
                            </Badge>
                        ))}
                        {Object.keys(deal.offerSummary).length === 0 && <Badge variant="outline" className="text-xs">No active offers</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(parseISO(deal.lastActivity), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/my-deals/${deal.id}`}> 
                       <Button variant="outline" size="sm">
                         View Details <Eye className="ml-2 h-4 w-4" />
                       </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Home, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { PropertyDetails } from '@/components/property/PropertyDetails';
import { OwnerPanel } from '@/components/property/OwnerPanel';
import { VisitorPanel } from '@/components/property/VisitorPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";

// Define VisitWithNotes here, as it's used by this component and passed from the parent
type VisitWithNotes = {
  id: string | number; // Allow number for potential Supabase ID types
  visit_date: string;
  status: string;
  notes: string | null;
};

// Type for active visit info
type ActiveVisitInfo = {
  id: string | number;
  visit_date: string;
  status: string;
};

interface Property {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  images?: string[] | null;
  price: number;
  currency?: string | null;
  type?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  area_m2?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking_slots?: number | null;
  created_at?: string | null;
  user_profiles?: {
    id: string;
    full_name?: string | null;
  } | null;
}

export default function PropertyPage() {
  const pathname = usePathname();
  const propertyId = pathname.split('/').pop() || '';
  
  console.log('=== Debug Info ===');
  console.log('Pathname:', pathname);
  console.log('Property ID:', propertyId);
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loadingFavoriteStatus, setLoadingFavoriteStatus] = useState(true);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedVisitDate, setSelectedVisitDate] = useState<Date | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [propertyVisits, setPropertyVisits] = useState<VisitWithNotes[]>([]);
  const [hasCompletedVisit, setHasCompletedVisit] = useState(false);
  const [activeScheduledVisit, setActiveScheduledVisit] = useState<ActiveVisitInfo | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data for propertyId:', propertyId);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);

        // Get property data
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .single();

        console.log('Property query result:', { data: propertyData, error: propertyError });

        if (propertyError) throw propertyError;
        if (!propertyData) throw new Error('Property not found');

        // Get user profile data
        console.log('Fetching profile data for user_id:', propertyData.user_id);
        const { data: userProfile, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', propertyData.user_id)
          .maybeSingle();

        console.log('Profile data:', userProfile);
        console.log('Profile error:', userError);

        // Combine property and user profile data
        const combinedData = {
          ...propertyData,
          user_profiles: userProfile || null
        };

        setProperty(combinedData);

        // Get favorite status if user is logged in
        if (user?.id) {
          const { data: favData } = await supabase
            .from('user_favorites')
            .select('user_id')
            .eq('user_id', user.id)
            .eq('property_id', propertyId)
            .maybeSingle();
          
          setIsFavorited(!!favData);

          // Fetch visits for this property
          const { data: visitsData, error: visitsError } = await supabase
            .from('visits')
            .select('*')
            .eq('property_id', propertyId)
            .eq('user_id', user.id)
            .order('visit_date', { ascending: false });

          if (visitsError) throw visitsError;

          const visits = visitsData || [];
          setPropertyVisits(visits);

          // Check for completed visit
          const hasCompleted = visits.some(v => v.status === 'completed');
          setHasCompletedVisit(hasCompleted);

          // Check for active scheduled visit
          const activeVisit = visits.find(v => v.status === 'scheduled');
          if (activeVisit) {
            setActiveScheduledVisit({
              id: activeVisit.id,
              visit_date: activeVisit.visit_date,
              status: activeVisit.status
            });
          }
        }
      } catch (err: any) {
        console.error('Error in fetchData:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        setLoadingFavoriteStatus(false);
      }
    };

    fetchData();
  }, [propertyId]);

  const toggleFavorite = async () => {
    if (!userId || !property) return;
    
    setLoadingFavoriteStatus(true);
    try {
      if (isFavorited) {
        await supabase
          .from('user_favorites')
          .delete()
          .match({ user_id: userId, property_id: property.id });
      } else {
        await supabase
          .from('user_favorites')
          .insert([{ user_id: userId, property_id: property.id }]);
      }
      setIsFavorited(!isFavorited);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setLoadingFavoriteStatus(false);
    }
  };

  const handleBookVisit = async () => {
    if (!selectedVisitDate || !userId || !property) return;

    setBookingLoading(true);
    try {
      const { error } = await supabase
        .from('visits')
        .insert([{
          property_id: property.id,
          user_id: userId,
          visit_date: selectedVisitDate.toISOString(),
          status: 'scheduled'
        }]);

      if (error) throw error;

      toast.success('Visit scheduled successfully!');
      setIsBookingDialogOpen(false);
      setSelectedVisitDate(null);

      // Refresh visits data
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('*')
        .eq('property_id', property.id)
        .eq('user_id', userId)
        .order('visit_date', { ascending: false });

      if (visitsError) throw visitsError;

      const visits = visitsData || [];
      setPropertyVisits(visits);

      // Update active scheduled visit
      const activeVisit = visits.find(v => v.status === 'scheduled');
      if (activeVisit) {
        setActiveScheduledVisit({
          id: activeVisit.id,
          visit_date: activeVisit.visit_date,
          status: activeVisit.status
        });
      }
    } catch (err: any) {
      console.error('Error booking visit:', err);
      toast.error(err.message || 'Failed to schedule visit');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading property details...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Property</h2>
        <p className="text-red-500 mb-6">{error || 'Property not found'}</p>
        <Link href="/search">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Search
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/search">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Search
          </Button>
        </Link>
      </div>

      <Card className="mb-8 shadow-lg">
        <CardHeader className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="w-full md:w-1/3">
            <PropertyGallery images={property.images || []} title={property.title} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-3xl font-bold text-primary mb-1">{property.title}</CardTitle>
            <CardDescription className="text-slate-600 mb-3">
              {property.address || 'Address not specified'} - {property.city}, {property.country}
            </CardDescription>
            <div className="flex items-center mb-3">
              <Avatar className="h-10 w-10 mr-3 border">
                <AvatarFallback>{property.user_profiles?.full_name?.charAt(0) || 'O'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">Property Owner</p>
                <p className="text-xs text-slate-500">
                  {property.user_profiles?.full_name || 'N/A'}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="capitalize">{property.type || 'Property'}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-green-600 mb-2">
            Price: {property.price.toLocaleString('es-CO', { style: 'currency', currency: property.currency || 'COP' })}
          </p>
          <p className="text-sm text-slate-700 mb-4 leading-relaxed whitespace-pre-line">
            {property.description}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <span><strong>Type:</strong> {property.type || 'N/A'}</span>
            <span><strong>Area:</strong> {property.area_m2 ? `${property.area_m2} m²` : 'N/A'}</span>
            <span><strong>Bedrooms:</strong> {property.bedrooms ?? 'N/A'}</span>
            <span><strong>Bathrooms:</strong> {property.bathrooms ?? 'N/A'}</span>
            <span><strong>Parking:</strong> {property.parking_slots ?? 'N/A'}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <PropertyDetails
            bedrooms={property.bedrooms || 0}
            bathrooms={property.bathrooms || 0}
            parking_spots={property.parking_slots || 0}
            area={property.area_m2 || 0}
            description={property.description || ''}
            created_at={property.created_at || ''}
          />
          {property.user_id === userId && (
            <OwnerPanel 
              property={property}
              onSaveDescription={(desc) => {
                // Implement save description
              }}
              onSaveMinConditions={(min) => {
                // Implement save min conditions
              }}
              onCreateOwnerOffer={(offer) => {
                // Implement create owner offer
              }}
            />
          )}
        </div>

        <div className="space-y-6">
          <VisitorPanel
            propertyId={property.id}
            isFavorited={isFavorited}
            onToggleFavorite={toggleFavorite}
            loadingFavoriteStatus={loadingFavoriteStatus}
            hasCompletedVisit={hasCompletedVisit}
            loadingCompletedVisitStatus={loading}
            activeScheduledVisit={activeScheduledVisit}
            onBookVisit={() => setIsBookingDialogOpen(true)}
            propertyVisits={propertyVisits}
          />
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Schedule a Visit</DialogTitle>
            <DialogDescription>
              Select a date and time for your visit to "{property?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="visit-date" className="text-sm font-medium">Visit Date & Time</label>
              <DatePicker
                id="visit-date"
                selected={selectedVisitDate}
                onChange={(date: Date | null) => setSelectedVisitDate(date)}
                showTimeSelect
                dateFormat="Pp"
                minDate={new Date()} // Prevent selecting past dates
                className="w-full p-2 border rounded-md"
                placeholderText="Select date and time"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={handleBookVisit} disabled={bookingLoading || !selectedVisitDate}>
              {bookingLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Schedule Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
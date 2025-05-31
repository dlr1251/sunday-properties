'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, notFound, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit3, Trash2, MessageSquare, CheckCircle, XCircle, Clock, User, Home, Loader2, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Profile {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
}

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
}

interface Deal {
  id: string;
  property_id: string;
  buyer_id: string;
  seller_id: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  current_offer_id: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  expiry_date?: string;
  deal_type?: string;
  final_price?: number;
  final_currency?: string;
  metadata?: any;
}

interface Offer {
  id: string;
  deal_id: string;
  property_id: string;
  user_id: string;
  parent_offer_id?: string;
  version: number;
  status: 'pending_review' | 'accepted' | 'rejected' | 'countered' | 'withdrawn';
  total_amount: number;
  currency: string;
  payment_structure: 'full' | 'installments';
  offer_validity_date?: string;
  other_conditions?: string;
  created_at: string;
  metadata?: {
    installments?: Array<{
      date: string;
      amount: number;
      currency: string;
      payment_method: string;
    }>;
  };
}

interface OfferWithUserProfile extends Offer {
  user_profile: Profile | null;
  parent_offer?: OfferWithUserProfile | null;
}

interface PropertyWithOwnerProfile extends Property {
  user_profiles: Profile | null;
}

const OfferCard = ({ offer, onWithdraw, isOwner, onAccept, onReject, onNegotiate, currentUserId, showHistory = false }: {
  offer: OfferWithUserProfile;
  onWithdraw: (offerId: string) => void;
  isOwner: boolean;
  currentUserId: string | null;
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
  onNegotiate: (offerId: string) => void;
  showHistory?: boolean;
}) => {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const canWithdraw = offer.user_id === currentUserId && offer.status !== 'withdrawn' && offer.status !== 'accepted' && offer.status !== 'rejected';
  const canEdit = offer.user_id === currentUserId && ['pending_review', 'negotiating', 'countered'].includes(offer.status);

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    await onWithdraw(offer.id);
    setIsWithdrawing(false);
  };

  let statusBadgeVariant: "default" | "destructive" | "secondary" | "outline" = "default";
  if (offer.status === 'accepted') statusBadgeVariant = 'secondary';
  else if (offer.status === 'rejected' || offer.status === 'withdrawn') statusBadgeVariant = 'destructive';
  else if (offer.status === 'pending_review') statusBadgeVariant = 'outline';

  const renderOfferChanges = (current: OfferWithUserProfile, parent?: OfferWithUserProfile | null) => {
    if (!parent) return null;
    
    const changes = [];
    if (current.total_amount !== parent.total_amount) {
      changes.push(`Amount: ${parent.total_amount} → ${current.total_amount}`);
    }
    if (current.payment_structure !== parent.payment_structure) {
      changes.push(`Payment: ${parent.payment_structure} → ${current.payment_structure}`);
    }
    if (current.other_conditions !== parent.other_conditions) {
      changes.push('Conditions updated');
    }
    
    return changes.length > 0 ? (
      <div className="mt-2 text-sm text-muted-foreground">
        <p className="font-medium">Changes from previous offer:</p>
        <ul className="list-disc list-inside">
          {changes.map((change, idx) => (
            <li key={idx}>{change}</li>
          ))}
        </ul>
      </div>
    ) : null;
  };

  return (
    <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Offer Version {offer.version}</CardTitle>
            <CardDescription>
              Amount: {offer.total_amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} - 
              Status: <Badge variant={statusBadgeVariant} className="capitalize">{offer.status.replace('_',' ')}</Badge>
            </CardDescription>
          </div>
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={offer.user_profile?.avatar_url || undefined} alt={offer.user_profile?.full_name || "User"} />
            <AvatarFallback>{offer.user_profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <p><strong>Offerer:</strong> {offer.user_profile?.full_name || 'N/A'} ({offer.user_profile?.email || 'No email'})</p>
        <p><strong>Payment:</strong> {offer.payment_structure === 'full' ? 'Full Payment' : 'Installments'}</p>
        {offer.payment_structure === 'installments' && offer.metadata?.installments && (
          <div className="pl-4 border-l-2 border-gray-200 ml-2">
            <p className="font-medium mb-1">Installments:</p>
            {offer.metadata.installments.map((inst, idx) => (
              <div key={idx} className="text-xs mb-1">
                {idx+1}. {inst.date ? parseISO(inst.date).toLocaleDateString() : 'N/A'}: {inst.amount.toLocaleString('es-CO', { style: 'currency', currency: String(inst.currency) })} ({inst.payment_method})
              </div>
            ))}
          </div>
        )}
        <p><strong>Submitted:</strong> {formatDistanceToNow(parseISO(offer.created_at), { addSuffix: true })}</p>
        {offer.offer_validity_date && <p><strong>Valid Until:</strong> {parseISO(offer.offer_validity_date).toLocaleDateString()}</p>}
        {offer.other_conditions && <p><strong>Conditions:</strong> {offer.other_conditions}</p>}
        
        {showHistory && offer.parent_offer && renderOfferChanges(offer, offer.parent_offer)}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
        {isOwner && offer.status === 'pending_review' && (
          <>
            <Button onClick={() => onAccept(offer.id)} variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="mr-2 h-4 w-4"/>Accept</Button>
            <Button onClick={() => onReject(offer.id)} variant="destructive" size="sm"><XCircle className="mr-2 h-4 w-4"/>Reject</Button>
            <Button onClick={() => onNegotiate(offer.id)} variant="outline" size="sm"><MessageSquare className="mr-2 h-4 w-4"/>Negotiate</Button>
          </>
        )}
        {canWithdraw && (
          <Button onClick={handleWithdraw} variant="destructive" size="sm" disabled={isWithdrawing}>
            {isWithdrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
            Withdraw Offer
          </Button>
        )}
        {canEdit && (
          <Link href={`/property/${encodeURIComponent(offer.property_id)}/make-offer?dealId=${offer.deal_id}&offerId=${offer.id}`}>
            <Button variant="outline" size="sm"><Edit3 className="mr-2 h-4 w-4" /> Edit Offer</Button>
          </Link>
        )}
        {showHistory && offer.parent_offer && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          >
            {isHistoryExpanded ? 'Hide History' : 'Show History'}
          </Button>
        )}
      </CardFooter>
      {showHistory && isHistoryExpanded && offer.parent_offer && (
        <CardContent className="pt-0">
          <div className="pl-4 border-l-2 border-gray-200">
            <OfferCard
              offer={offer.parent_offer}
              onWithdraw={onWithdraw}
              isOwner={isOwner}
              currentUserId={currentUserId}
              onAccept={onAccept}
              onReject={onReject}
              onNegotiate={onNegotiate}
              showHistory={true}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default function DealDetailPage() {
  const pathname = usePathname();
  const router = useRouter();
  const dealId = pathname.split('/').pop() || '';

  console.log('=== Deal Details Page Initialization ===');
  console.log('Pathname:', pathname);
  console.log('Deal ID from URL:', dealId);

  // Validate dealId format
  if (!dealId || typeof dealId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dealId)) {
    console.error('Invalid deal ID format:', dealId);
    notFound();
  }

  const [userId, setUserId] = useState<string | null>(null);
  const [dealData, setDealData] = useState<any>(null);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [currentOffer, setCurrentOffer] = useState<any>(null);
  const [offerHistory, setOfferHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [counterOffer, setCounterOffer] = useState<Partial<Offer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDealDetails = async () => {
      console.log('\n=== Starting Deal Details Fetch ===');
      setLoading(true);
      setError(null);

      try {
        // Auth Check
        console.log('\n--- Checking Authentication ---');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('Auth Result:', {
          userId: user?.id,
          hasError: !!userError,
          errorDetails: userError
        });
        
        if (userError || !user) {
          console.error('Authentication Failed:', userError);
          toast.error('You must be logged in to view deals.');
          router.push('/login');
          setLoading(false);
          return;
        }
        setUserId(user.id);
        console.log('Current User ID Set:', user.id);

        // Fetch Deal with permission check
        console.log('\n--- Fetching Deal Details with Permission Check ---');
        console.log('Attempting to fetch deal with ID:', dealId);
        
        const { data: dealData, error: dealError } = await supabase
          .from('deals')
          .select('*')
          .eq('id', dealId)
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .single();

        console.log('Deal Query Result:', {
          success: !!dealData,
          error: dealError,
          dealData: dealData,
          query: `id=${dealId} AND (buyer_id=${user.id} OR seller_id=${user.id})`
        });

        if (dealError) {
          console.error('Deal Fetch Error:', {
            code: dealError.code,
            message: dealError.message,
            details: dealError.details,
            hint: dealError.hint
          });
          
          if (dealError.code === 'PGRST116') {
            setError('You do not have permission to access this deal. Only the buyer or seller can view deal details.');
          } else {
            setError(`Failed to load deal: ${dealError.message}`);
          }
          setLoading(false);
          return;
        }

        if (!dealData) {
          console.error('No Deal Data Found or No Permission');
          setError('You do not have permission to access this deal. Only the buyer or seller can view deal details.');
          setLoading(false);
          return;
        }

        // Verify user has access to this deal
        const isBuyer = dealData.buyer_id === user.id;
        const isSeller = dealData.seller_id === user.id;
        
        console.log('Access Check:', {
          isBuyer,
          isSeller,
          dealBuyerId: dealData.buyer_id,
          dealSellerId: dealData.seller_id,
          currentUserId: user.id,
          dealId: dealData.id
        });

        if (!isBuyer && !isSeller) {
          console.error('User does not have access to this deal');
          setError('You do not have permission to access this deal. Only the buyer or seller can view deal details.');
          setLoading(false);
          return;
        }

        setDealData(dealData as Deal);
        console.log('Deal Data Set:', dealData);

        // Fetch Current Offer
        if (dealData.current_offer_id) {
          console.log('\n--- Fetching Current Offer ---');
          console.log('Current Offer ID:', dealData.current_offer_id);
          const { data: currentOfferData, error: currentOfferError } = await supabase
            .from('offers')
            .select('*')
            .eq('id', dealData.current_offer_id)
            .single();

          console.log('Current Offer Query Result:', {
            success: !!currentOfferData,
            error: currentOfferError,
            currentOfferData: currentOfferData
          });

          if (!currentOfferError && currentOfferData) {
            setCurrentOffer(currentOfferData as Offer);
            console.log('Current Offer Data Set:', currentOfferData);
          }
        }

        // Fetch Property
        console.log('\n--- Fetching Property Details ---');
        console.log('Property ID:', dealData.property_id);
        try {
          const { data: propertyData, error: propertyError } = await supabase
            .from('properties')
            .select('*')
            .eq('id', dealData.property_id)
            .single();

          console.log('Property Query Result:', {
            success: !!propertyData,
            error: propertyError,
            propertyData: propertyData
          });

          if (propertyError) {
            console.error('Property Fetch Error:', propertyError);
            setError(`Failed to load property details: ${propertyError.message}`);
          } else if (!propertyData) {
            console.error('No Property Data Found');
            setError('Property not found');
          } else {
            setPropertyData(propertyData as Property);
            console.log('Property Data Set:', propertyData);
          }
        } catch (err) {
          console.error('Unexpected error fetching property:', err);
          setError('An unexpected error occurred while loading property details');
        }

        // Fetch Offer History
        console.log('\n--- Fetching Offer History ---');
        const { data: offersData, error: offersError } = await supabase
          .from('offers')
          .select(`
            *,
            profiles!user_id (
              id,
              full_name,
              avatar_url,
              email
            ),
            parent_offer:parent_offer_id (*)
          `)
          .eq('deal_id', dealId)
          .order('version', { ascending: false });

        console.log('Offer History Query Result:', {
          success: !!offersData,
          error: offersError,
          offerCount: offersData?.length,
          offersData: offersData
        });

        if (!offersError && offersData) {
          setOfferHistory(offersData as OfferWithUserProfile[]);
          console.log('Offer History Set:', offersData);
        }

        setLoading(false);
        console.log('\n=== Deal Details Fetch Complete ===');
        console.log('Final State:', {
          hasProperty: !!propertyData,
          hasDeal: !!dealData,
          hasCurrentOffer: !!currentOffer,
          offerHistoryCount: offerHistory.length,
        });

      } catch (err) {
        console.error('Unexpected error in fetchDealDetails:', err);
        setError('An unexpected error occurred while loading the deal details.');
        setLoading(false);
      }
    };

    fetchDealDetails();
  }, [dealId, router]);

  const handleWithdrawOffer = async (offerId: string) => {
    console.log('Attempting to withdraw offer:', offerId);
    if (!userId) {
      console.error('Cannot withdraw offer: User not identified');
      toast.error("User not identified.");
      return;
    }
    try {
      console.log('Updating offer status to withdrawn');
      const { error: updateError } = await supabase
        .from('offers')
        .update({ status: 'withdrawn' })
        .eq('id', offerId)
        .eq('user_id', userId);

      console.log('Offer withdrawal result:', { error: updateError });

      if (updateError) {
        throw updateError;
      }
      toast.success('Offer withdrawn successfully');
      console.log('Offer withdrawn successfully, refreshing page');
      router.refresh();
    } catch (err: any) {
      console.error('Withdrawal failed:', err);
      toast.error(`Failed to withdraw offer: ${err.message}`);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    console.log('Accept offer clicked for offer ID:', offerId);
    toast.info("Accept functionality to be implemented.");
  };

  const handleRejectOffer = async (offerId: string) => {
    console.log('Reject offer clicked for offer ID:', offerId);
    toast.info("Reject functionality to be implemented.");
  };

  const handleNegotiateOffer = (offerId: string) => {
    console.log('Negotiate offer clicked for offer ID:', offerId);
    const offer = currentOffer?.id === offerId ? currentOffer : 
                 offerHistory.find(o => o.id === offerId);
    
    if (!offer) {
      toast.error('Offer not found');
      return;
    }

    setSelectedOffer(offer);
    setCounterOffer({
      total_amount: offer.total_amount,
      currency: offer.currency,
      payment_structure: offer.payment_structure,
      offer_validity_date: offer.offer_validity_date,
      other_conditions: offer.other_conditions,
      metadata: offer.metadata
    });
    setIsNegotiating(true);
  };

  const handleSubmitCounterOffer = async () => {
    if (!selectedOffer || !userId) {
      toast.error('Missing required data');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: newOffer, error } = await supabase
        .from('offers')
        .insert([{
          deal_id: dealId,
          property_id: selectedOffer.property_id,
          user_id: userId,
          parent_offer_id: selectedOffer.id,
          version: selectedOffer.version + 1,
          status: 'pending_review',
          total_amount: counterOffer.total_amount,
          currency: counterOffer.currency,
          payment_structure: counterOffer.payment_structure,
          offer_validity_date: counterOffer.offer_validity_date,
          other_conditions: counterOffer.other_conditions,
          metadata: counterOffer.metadata
        }])
        .select()
        .single();

      if (error) throw error;

      // Update deal with new current offer
      const { error: updateError } = await supabase
        .from('deals')
        .update({ current_offer_id: newOffer.id })
        .eq('id', dealId);

      if (updateError) throw updateError;

      toast.success('Counter offer submitted successfully');
      setIsNegotiating(false);
      router.refresh();
    } catch (err: any) {
      console.error('Error submitting counter offer:', err);
      toast.error(err.message || 'Failed to submit counter offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    console.log('Rendering loading state');
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading deal details...</p></div>;
  }

  if (error && !propertyData && !currentOffer) {
    console.log('Rendering error state:', error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Deal</h2>
        <p className="text-red-500 mb-6">{error}</p>
        <div className="space-y-4">
          <Link href="/my-deals">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Deals</Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => router.refresh()}
            className="ml-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  const isCurrentUserOwner = propertyData?.user_id === userId;
  console.log('Current user role:', { isOwner: isCurrentUserOwner, userId: userId, propertyOwnerId: propertyData?.user_id });

  console.log('Rendering main deal details view with:', {
    propertyData,
    dealData,
    currentOffer,
    offerHistoryLength: offerHistory.length
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/my-deals">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Deals</Button>
        </Link>
      </div>

      {propertyData && (
        <Card className="mb-8 shadow-lg">
          <CardHeader className="flex flex-col md:flex-row md:items-start gap-4">
            {propertyData.images && propertyData.images.length > 0 ? (
              <img src={propertyData.images[0]} alt={propertyData.title} className="w-full md:w-1/3 h-auto max-h-80 object-cover rounded-lg shadow-md" />
            ) : (
              <div className="w-full md:w-1/3 h-48 bg-slate-200 flex items-center justify-center rounded-lg">
                <Home className="h-16 w-16 text-slate-400" />
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold text-primary mb-1">{propertyData.title}</CardTitle>
              <CardDescription className="text-slate-600 mb-3">
                {propertyData.address || 'Address not specified'} - {propertyData.city}, {propertyData.country}
              </CardDescription>
              <div className="flex items-center mb-3">
                <Avatar className="h-10 w-10 mr-3 border">
                  <AvatarImage src={propertyData.user_profiles?.avatar_url || undefined} alt={propertyData.user_profiles?.full_name || "Owner"} />
                  <AvatarFallback>{propertyData.user_profiles?.full_name?.charAt(0) || 'O'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">Property Owner</p>
                  <p className="text-xs text-slate-500">{propertyData.user_profiles?.full_name || 'N/A'} {propertyData.user_profiles?.email ? `(${propertyData.user_profiles.email})` : ''}</p>
                </div>
              </div>
              {dealData && <Badge variant="secondary" className="capitalize">Deal Status: {dealData.status.replace('_', ' ')}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-green-600 mb-2">Price: {propertyData.price.toLocaleString('es-CO', { style: 'currency', currency: propertyData.currency || 'COP' })}</p>
            <p className="text-sm text-slate-700 mb-4 leading-relaxed whitespace-pre-line">{propertyData.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <span><strong>Type:</strong> {propertyData.type || 'N/A'}</span>
              <span><strong>Area:</strong> {propertyData.area_m2 || 'N/A'} m²</span>
              <span><strong>Bedrooms:</strong> {propertyData.bedrooms ?? 'N/A'}</span>
              <span><strong>Bathrooms:</strong> {propertyData.bathrooms ?? 'N/A'}</span>
              <span><strong>Parking:</strong> {propertyData.parking_slots ?? 'N/A'}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Link href={`/property/${encodeURIComponent(propertyData.id)}`} passHref>
              <Button variant="outline"><Eye className="mr-2 h-4 w-4"/> View Full Property Page</Button>
            </Link>
          </CardFooter>
        </Card>
      )}

      <Separator className="my-8" />

      <h2 className="text-2xl font-semibold mb-6">Current Offer</h2>
      {currentOffer ? (
        <OfferCard
          offer={currentOffer}
          onWithdraw={handleWithdrawOffer}
          isOwner={isCurrentUserOwner}
          currentUserId={userId}
          onAccept={handleAcceptOffer}
          onReject={handleRejectOffer}
          onNegotiate={handleNegotiateOffer}
          showHistory={true}
        />
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <p className="text-slate-500 text-lg">No active offer for this deal.</p>
          {!isCurrentUserOwner && propertyData && (
            <Link href={`/property/${encodeURIComponent(propertyData.id)}/make-offer?dealId=${dealId}`} passHref>
              <Button className="mt-4">Make an Offer</Button>
            </Link>
          )}
        </div>
      )}

      {offerHistory.length > 1 && (
        <>
          <h2 className="text-2xl font-semibold my-6">Offer History</h2>
          <div className="space-y-4">
            {offerHistory.map((offer, index) => (
              <Card key={offer.id} className="relative">
                {index < offerHistory.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-slate-200" />
                )}
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">Version {offer.version}</CardTitle>
                      <CardDescription>
                        Amount: {offer.total_amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} - 
                        Status: <Badge variant={offer.status === 'accepted' ? 'secondary' : 
                                               offer.status === 'rejected' || offer.status === 'withdrawn' ? 'destructive' : 
                                               'outline'} 
                                      className="capitalize">{offer.status.replace('_',' ')}</Badge>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10 border">
                        <AvatarFallback>{offer.user_profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <p className="font-medium">{offer.user_profile?.full_name || 'Unknown User'}</p>
                        <p className="text-slate-500">{formatDistanceToNow(parseISO(offer.created_at), { addSuffix: true })}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Payment Structure</p>
                      <p className="text-slate-600">{offer.payment_structure === 'full' ? 'Full Payment' : 'Installments'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Valid Until</p>
                      <p className="text-slate-600">
                        {offer.offer_validity_date ? parseISO(offer.offer_validity_date).toLocaleDateString() : 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  {offer.payment_structure === 'installments' && offer.metadata?.installments && (
                    <div className="mt-2">
                      <p className="font-medium mb-1">Installments:</p>
                      <div className="pl-4 border-l-2 border-slate-200">
                        {offer.metadata.installments.map((inst, idx) => (
                          <div key={idx} className="text-sm mb-1">
                            {idx+1}. {inst.date ? parseISO(inst.date).toLocaleDateString() : 'N/A'}: {inst.amount.toLocaleString('es-CO', { style: 'currency', currency: String(inst.currency) })} ({inst.payment_method})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {offer.other_conditions && (
                    <div className="mt-2">
                      <p className="font-medium">Conditions:</p>
                      <p className="text-slate-600 whitespace-pre-line">{offer.other_conditions}</p>
                    </div>
                  )}

                  {offer.parent_offer && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="font-medium text-sm text-slate-600 mb-2">Changes from Version {offer.parent_offer.version}:</p>
                      <ul className="text-sm space-y-1">
                        {offer.total_amount !== offer.parent_offer.total_amount && (
                          <li>Amount: {offer.parent_offer.total_amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} → {offer.total_amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</li>
                        )}
                        {offer.payment_structure !== offer.parent_offer.payment_structure && (
                          <li>Payment: {offer.parent_offer.payment_structure} → {offer.payment_structure}</li>
                        )}
                        {offer.other_conditions !== offer.parent_offer.other_conditions && (
                          <li>Conditions updated</li>
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 pt-4">
                  {isCurrentUserOwner && offer.status === 'pending_review' && (
                    <>
                      <Button onClick={() => handleAcceptOffer(offer.id)} variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle className="mr-2 h-4 w-4"/>Accept
                      </Button>
                      <Button onClick={() => handleRejectOffer(offer.id)} variant="destructive" size="sm">
                        <XCircle className="mr-2 h-4 w-4"/>Reject
                      </Button>
                      <Button onClick={() => handleNegotiateOffer(offer.id)} variant="outline" size="sm">
                        <MessageSquare className="mr-2 h-4 w-4"/>Negotiate
                      </Button>
                    </>
                  )}
                  {offer.user_id === userId && ['pending_review', 'negotiating', 'countered'].includes(offer.status) && (
                    <Button onClick={() => handleWithdrawOffer(offer.id)} variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4"/>Withdraw
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Negotiation Dialog */}
      <Dialog open={isNegotiating} onOpenChange={setIsNegotiating}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Negotiate Offer</DialogTitle>
            <DialogDescription>
              Review and modify the offer details to create a counter offer.
            </DialogDescription>
          </DialogHeader>

          {selectedOffer && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Total Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={counterOffer.total_amount}
                    onChange={(e) => setCounterOffer(prev => ({
                      ...prev,
                      total_amount: parseFloat(e.target.value)
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={counterOffer.currency}
                    onChange={(e) => setCounterOffer(prev => ({
                      ...prev,
                      currency: e.target.value
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment">Payment Structure</Label>
                <select
                  id="payment"
                  className="w-full p-2 border rounded-md"
                  value={counterOffer.payment_structure}
                  onChange={(e) => setCounterOffer(prev => ({
                    ...prev,
                    payment_structure: e.target.value as 'full' | 'installments'
                  }))}
                >
                  <option value="full">Full Payment</option>
                  <option value="installments">Installments</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validity">Offer Validity Date</Label>
                <DatePicker
                  selected={counterOffer.offer_validity_date ? new Date(counterOffer.offer_validity_date) : null}
                  onChange={(date) => setCounterOffer(prev => ({
                    ...prev,
                    offer_validity_date: date?.toISOString()
                  }))}
                  className="w-full p-2 border rounded-md"
                  minDate={new Date()}
                  dateFormat="P"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditions">Other Conditions</Label>
                <Textarea
                  id="conditions"
                  value={counterOffer.other_conditions || ''}
                  onChange={(e) => setCounterOffer(prev => ({
                    ...prev,
                    other_conditions: e.target.value
                  }))}
                  className="min-h-[100px]"
                />
              </div>

              {counterOffer.payment_structure === 'installments' && (
                <div className="space-y-2">
                  <Label>Installments</Label>
                  {/* Add installment management UI here */}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNegotiating(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitCounterOffer}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Counter Offer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
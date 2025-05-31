"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

// Reusing a similar Offer interface, ensure it matches your actual data structure
interface Offer {
  id: string;
  property_id: string;
  user_id: string; // Added from schema
  amount: number;
  currency: string; // Added from schema
  payment_method: string; // Added from schema
  status: string; // e.g., 'pending', 'accepted', 'rejected', 'countered'
  created_at: string;
  updated_at?: string; // From schema
  // property_title?: string; // Removed as we are not joining for now
}

// Define an interface for Property details based on your schema
interface Property {
  id: string;
  user_id: string;
  title: string;
  type: string;
  price: number;
  currency: string;
  address: string;
  city: string;
  state: string; // Address state
  postal_code: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  created_at: string;
  updated_at: string;
}

// Define an interface for User Profile details
interface Profile {
  id: string; // Should match auth.users.id
  full_name?: string;
  avatar_url?: string;
  // Add other profile fields you might have, e.g., username, contact_info
}

export default function OfferDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const offerId = params.id as string;

  const [offer, setOffer] = useState<Offer | null>(null);
  const [propertyDetails, setPropertyDetails] = useState<Property | null>(null); // New state for property details
  const [offererProfile, setOffererProfile] = useState<Profile | null>(null); // New state for offerer's profile
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!offerId) return;

    const fetchDetails = async () => {
      setLoading(true);
      setOffer(null); // Reset previous state
      setPropertyDetails(null); // Reset previous state
      setOffererProfile(null); // Reset previous state

      // 1. Fetch Offer
      const { data: offerData, error: offerError } = await supabase
        .from("offers")
        .select("*")
        .eq("id", offerId)
        .single();

      if (offerError) {
        console.error("Error fetching offer details:", offerError);
        toast.error("Failed to load offer details.");
        setLoading(false);
        return;
      }

      const fetchedOffer = {
          ...offerData,
          amount: typeof offerData.amount === 'string' ? parseFloat(offerData.amount) : offerData.amount,
      } as Offer;
      setOffer(fetchedOffer);

      // 2. If offer fetched successfully, fetch related details
      if (fetchedOffer) {
        // Fetch Property Details
        if (fetchedOffer.property_id) {
          const { data: propertyData, error: propertyError } = await supabase
            .from("properties")
            .select("*") 
            .eq("id", fetchedOffer.property_id)
            .single();

          if (propertyError) {
            console.error("Error fetching property details:", propertyError);
            toast.error("Failed to load associated property details.");
          } else {
            setPropertyDetails(propertyData as Property);
          }
        }

        // Fetch Offerer Profile Details
        if (fetchedOffer.user_id) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles") // Assuming your public user profiles table is named 'profiles'
            .select("*")
            .eq("id", fetchedOffer.user_id) // Assuming 'id' in profiles matches user_id from offers
            .single();

          if (profileError) {
            console.error("Error fetching offerer profile:", profileError);
            // Optionally, inform the user or just log the error
            // toast.warn("Could not load offerer details."); 
          } else {
            setOffererProfile(profileData as Profile);
          }
        }
      }
      setLoading(false);
    };

    fetchDetails();
  }, [offerId]);

  const handleUpdateOfferStatus = async (newStatus: string) => {
    if (!offer) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("offers")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", offer.id);

      if (error) throw error;

      setOffer({ ...offer, status: newStatus });
      toast.success(`Offer ${newStatus}!`);
      // Optionally, navigate or refresh data
      // router.push('/offers'); 
    } catch (err) {
      console.error(`Error updating offer to ${newStatus}:`, err);
      toast.error(`Failed to ${newStatus.toLowerCase()} offer.`);
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleAcceptOffer = () => handleUpdateOfferStatus("accepted");
  const handleDeclineOffer = () => handleUpdateOfferStatus("declined");
  
  // Counter offer might navigate to a new page/modal or update status to 'countered'
  // and then allow editing of the offer amount or terms.
  const handleCounterOffer = () => {
    if (!offer) return;
    // For now, let's just log or set status to 'countered'
    // You would typically navigate to a form or open a modal here
    // For example: router.push(`/offer/${offer.id}/counter`);
    toast.info("Counter offer functionality to be implemented.");
    // Or update status: handleUpdateOfferStatus("countered");
  };

  if (loading) {
    return <div className="p-6 text-center">Loading offer details...</div>;
  }

  if (!offer) {
    return <div className="p-6 text-center text-destructive">Offer not found.</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-1">Offer Details</CardTitle>
              <p className="text-sm text-muted-foreground">Offer ID: {offer.id}</p>
            </div>
            <Badge 
              variant={
                offer.status === 'accepted' ? 'default' :
                offer.status === 'declined' || offer.status === 'rejected' ? 'destructive' :
                offer.status === 'countered' ? 'secondary' :
                'secondary'
              }
              className="text-sm"
            >
              {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Property Details:</h3>
            {propertyDetails ? (
              <Card className="mt-2 p-4 bg-muted/30">
                <Link href={`/property/${encodeURIComponent(propertyDetails.id)}`} className="hover:underline">
                  <CardTitle className="text-lg mb-2">{propertyDetails.title}</CardTitle>
                </Link>
                <p className="text-sm"><strong>Type:</strong> {propertyDetails.type}</p>
                <p className="text-sm"><strong>Price:</strong> {propertyDetails.currency} {propertyDetails.price?.toLocaleString()}</p>
                <p className="text-sm"><strong>Location:</strong> {propertyDetails.address}, {propertyDetails.city}, {propertyDetails.state} {propertyDetails.postal_code}</p>
                <p className="text-sm"><strong>Description:</strong> {propertyDetails.description}</p>
                 {/* Add more property details as needed */}
              </Card>
            ) : offer?.property_id ? (
              <p className="text-sm">
                Loading property details or property not found... 
                <Link href={`/property/${encodeURIComponent(offer.property_id)}`} className="text-blue-600 hover:underline">
                  (View Property ID: {offer.property_id})
                </Link>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Property ID not available.</p>
            )}
          </div>
          <div>
            <h3 className="font-semibold">Offer Amount:</h3>
            <p className="text-lg">{offer.currency} {offer.amount.toLocaleString()}</p>
          </div>
          <div>
            <h3 className="font-semibold">Payment Method:</h3>
            <p>{offer.payment_method}</p>
          </div>
          <div>
            <h3 className="font-semibold">Offered By:</h3>
            {offererProfile ? (
              <div>
                <p>{offererProfile.full_name || "N/A"}</p>
                {/* You could add avatar here if you have it: 
                {offererProfile.avatar_url && <img src={offererProfile.avatar_url} alt={offererProfile.full_name} className="w-10 h-10 rounded-full mt-1" />} 
                */}
                <p className="text-xs text-muted-foreground">User ID: {offer.user_id}</p>
              </div>
            ) : offer?.user_id ? (
              <p className="text-sm">Loading offerer details... (User ID: {offer.user_id})</p>
            ) : (
              <p className="text-sm text-muted-foreground">Offerer information not available.</p>
            )}
          </div>
          <div>
            <h3 className="font-semibold">Offer Date:</h3>
            <p>{new Date(offer.created_at).toLocaleString()}</p>
          </div>
          {/* Add more offer details here as needed, e.g., offerer info, message */}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
          {offer.status === 'pending' && ( // Only show actions if offer is pending
            <>
              <Button 
                onClick={handleDeclineOffer} 
                variant="outline" 
                disabled={actionLoading}
              >
                {actionLoading ? 'Declining...' : 'Decline Offer'}
              </Button>
              <Button 
                onClick={handleCounterOffer} 
                variant="outline"
                disabled={actionLoading} // Disable if any action is in progress
              >
                Counter Offer
              </Button>
              <Button 
                onClick={handleAcceptOffer} 
                disabled={actionLoading}
              >
                {actionLoading ? 'Accepting...' : 'Accept Offer'}
              </Button>
            </>
          )}
          {offer.status !== 'pending' && (
             <p className="text-sm text-muted-foreground">This offer has been {offer.status}.</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 
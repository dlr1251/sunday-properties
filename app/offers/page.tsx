"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Define a basic interface for an Offer
interface Offer {
  id: string;
  property_id: string; // Assuming offers are linked to properties
  user_id: string; // Added from schema
  amount: number;
  currency: string; // Added from schema
  payment_method: string; // Added from schema
  status: string; // e.g., 'pending', 'accepted', 'rejected'
  created_at: string;
  updated_at?: string; // Added from schema
  // Add other relevant offer fields here, e.g., offerer_user_id
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      // TODO: Secure this query, e.g., fetch offers for the current user (either as seller or buyer)
      const { data, error } = await supabase
        .from("offers") // Assuming your offers table is named 'offers'
        .select("id, property_id, user_id, amount, currency, payment_method, status, created_at, updated_at") // Updated select
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching offers:', error);
        setOffers([]);
      } else {
        // Map data if necessary, e.g., if amount is string
        const formattedOffers = (data || []).map(offer => ({
          ...offer,
          amount: typeof offer.amount === 'string' ? parseFloat(offer.amount) : offer.amount,
        }));
        setOffers(formattedOffers);
      }
      setLoading(false);
    };
    fetchOffers();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Offers</h1>
        {/* Optional: Button to create a new offer or navigate elsewhere
        <Link href="/make-offer"> 
          <Button>Make New Offer</Button>
        </Link>
        */}
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Received/Sent Offers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">Loading offers...</div>
          ) : offers.length === 0 ? (
            <div className="p-6 text-muted-foreground">No offers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Property ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Offerer (User ID)</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map((offer, idx) => (
                    <TableRow key={offer.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-muted'}>
                      <TableCell className="font-medium">
                        <Link href={`/property/${encodeURIComponent(offer.property_id)}`} className="hover:underline">
                          {offer.property_id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {offer.currency} {offer.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            offer.status === 'accepted' ? 'default' : 
                            offer.status === 'rejected' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {offer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{offer.user_id}</TableCell>
                      <TableCell>{new Date(offer.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {/* Adjust actions as needed */}
                        <Link href={`/offer/${offer.id}`}>
                          <Button size="sm" variant="outline">View Details</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
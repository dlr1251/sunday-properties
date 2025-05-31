import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Heart, Loader2, Info, Edit3, CalendarCheck2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

// Define VisitWithNotes here, as it's used by this component and passed from the parent
export type VisitWithNotes = {
  id: string | number; // Allow number for potential Supabase ID types
  visit_date: string;
  status: string;
  notes: string | null;
};

// Type for active visit info (can remain as is or use parts of VisitWithNotes)
type ActiveVisitInfo = {
  id: string | number;
  visit_date: string;
  status: string;
};

interface VisitorPanelProps {
  propertyId: string;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  loadingFavoriteStatus: boolean;
  hasCompletedVisit: boolean; // Renamed from hasCompletedVisitForCurrentProperty for simplicity here
  loadingCompletedVisitStatus: boolean;
  activeScheduledVisit: ActiveVisitInfo | null;
  // loadingActiveScheduledVisit can be covered by loadingCompletedVisitStatus if it implies all visit data is loading
  onBookVisit: () => void; // Function to open the booking dialog on the parent page
  propertyVisits: VisitWithNotes[]; // All visits for this property, passed from parent
}

export function VisitorPanel({
  propertyId,
  isFavorited,
  onToggleFavorite,
  loadingFavoriteStatus,
  hasCompletedVisit,
  loadingCompletedVisitStatus,
  activeScheduledVisit,
  onBookVisit,
  propertyVisits,
}: VisitorPanelProps) {

  // Combined loading state for initial visit-related data
  if (loadingCompletedVisitStatus) { // Assuming this covers loading of propertyVisits and activeScheduledVisit too
    return (
      <Card className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading visit information...</span>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Favorite Button - always available */}
      <Button 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2"
        onClick={onToggleFavorite}
        disabled={loadingFavoriteStatus}
        title={isFavorited ? "Remove from favorites" : "Save as favorite"}
      >
        {loadingFavoriteStatus ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Heart className={`h-5 w-5 ${isFavorited ? 'text-red-500 fill-red-500' : 'text-gray-500'}`} />
        )}
        <span>{isFavorited ? 'Favorited' : 'Save as Favourite'}</span>
      </Button>

      {/* Visit History Section */}
      {propertyVisits && propertyVisits.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Your Visit History</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {propertyVisits.map(visit => (
              <div key={visit.id} className="p-3 border rounded-md bg-slate-50 dark:bg-slate-800">
                <p className="font-semibold"><strong>Date:</strong> {format(new Date(visit.visit_date), 'PPP p')}</p>
                <p><strong className="capitalize">Status:</strong> <span className={`font-medium ${visit.status === 'completed' ? 'text-green-600' : visit.status === 'scheduled' ? 'text-blue-600' : 'text-gray-600'}`}>{visit.status}</span></p>
                {visit.notes && (
                  <div className="mt-2">
                    <strong className="text-sm">Notes:</strong>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-white dark:bg-slate-700 p-2 rounded-md border">
                      {visit.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Panel based on visit status */}
      {activeScheduledVisit ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-5 w-5 text-blue-500" />
              Visit Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              You have a visit scheduled for this property on: 
              <strong className="ml-1">{format(new Date(activeScheduledVisit.visit_date), 'PPP p')}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              To make changes or start your visit, please go to your visits page.
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/my-visits">
                <Edit3 className="mr-2 h-4 w-4" /> Manage My Visits
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : hasCompletedVisit ? (
        // User has completed a visit, no active scheduled visit for THIS property
        <Button asChild className="w-full py-6 text-lg" size="lg">
          <Link href={`/property/${encodeURIComponent(propertyId)}/make-offer`}>
            <DollarSign className="mr-2 h-6 w-6" /> Make an Offer
          </Link>
        </Button>
      ) : (
        // No active scheduled visit for THIS property AND no completed visit yet
        <div className="text-center space-y-3">
          <Button className="w-full py-6 text-lg" onClick={onBookVisit} size="lg">
            <CalendarCheck2 className="mr-2 h-6 w-6" /> Book a Visit
          </Button>
          <p className="text-sm text-muted-foreground">
            You need to visit the property before you can make an offer.
          </p>
        </div>
      )}
    </div>
  );
} 
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Loader2, CalendarX2, Home, CalendarCheck, AlertTriangle, CalendarDays, Clock, PlayCircle, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { format, isPast } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Textarea } from "@/components/ui/textarea";

type PropertyForVisit = {
  id: string;
  title: string;
  // address?: string; 
  // city?: string;    
  // images?: string[]; 
};

// Allow 'cancelling' as a possible status for UI updates
type VisitStatus = 'scheduled' | 'completed' | 'cancelled' | 'cancelling';

type Visit = {
  id: string;
  property_id: string;
  visit_date: string;
  status: VisitStatus;
  notes?: string | null;
  nda_accepted?: boolean;
  created_at: string;
  properties: PropertyForVisit | null; 
};

export default function MyVisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // State for Reschedule Dialog
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [visitToReschedule, setVisitToReschedule] = useState<Visit | null>(null);
  const [newVisitDate, setNewVisitDate] = useState<Date | null>(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [cancellingVisitId, setCancellingVisitId] = useState<string | number | null>(null);

  // State for Notes Dialog
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [visitForNotes, setVisitForNotes] = useState<Visit | null>(null);
  const [currentNotes, setCurrentNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        toast.error('Please log in to view your visits.');
        router.push('/login');
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const fetchVisits = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('visits')
        .select(`
          id,
          property_id,
          visit_date,
          status,
          notes,
          nda_accepted,
          created_at,
          properties (
            id,
            title
          )
        `)
        .eq('user_id', userId)
        .order('visit_date', { ascending: false });

      if (fetchError) {
        console.error("Supabase fetch error:", fetchError);
        throw fetchError;
      }
      
      const formattedVisits = (data || []).map(item => {
        let relatedProperty: PropertyForVisit | null = null;
        if (item.properties) {
          if (Array.isArray(item.properties)) {
            relatedProperty = item.properties.length > 0 ? item.properties[0] as PropertyForVisit : null;
          } else {
            relatedProperty = item.properties as PropertyForVisit;
          }
        }

        return {
          id: item.id,
          property_id: item.property_id,
          visit_date: item.visit_date,
          status: item.status as VisitStatus,
          notes: item.notes,
          nda_accepted: item.nda_accepted,
          created_at: item.created_at,
          properties: relatedProperty
        } as Visit;
      });
      setVisits(formattedVisits);

    } catch (err: any) {
      setError('Failed to load your visits. Please try again. Original error: ' + err.message);
      toast.error('Failed to load your visits.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchVisits();
    } 
  }, [userId, fetchVisits]);

  const handleCancelVisit = async (visitId: string | number) => {
    setCancellingVisitId(visitId);
    const originalVisits = [...visits];
    // Optimistically update UI
    setVisits(prevVisits => prevVisits.map(v => v.id === visitId ? { ...v, status: 'cancelling' as VisitStatus } : v));
    try {
      const { error: updateError } = await supabase
        .from('visits')
        .update({ status: 'cancelled' })
        .eq('id', visitId)
        .eq('user_id', userId);
      if (updateError) throw updateError;
      toast.success('Visit cancelled successfully.');
      // Confirm update in UI
      setVisits(prevVisits => prevVisits.map(v => v.id === visitId ? { ...v, status: 'cancelled' as VisitStatus } : v));
    } catch (err: any) {
      toast.error('Failed to cancel visit. ' + (err.message || ''));
      setVisits(originalVisits); // Revert on error
    } finally {
      setCancellingVisitId(null);
    }
  };

  const openRescheduleDialog = (visit: Visit) => {
    setVisitToReschedule(visit);
    setNewVisitDate(new Date(visit.visit_date)); // Initialize with current visit date
    setIsRescheduleDialogOpen(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!visitToReschedule || !newVisitDate) return;

    setRescheduleLoading(true);
    try {
      const { error } = await supabase
        .from('visits')
        .update({
          visit_date: newVisitDate.toISOString(),
          status: 'scheduled' // Re-set status to scheduled
        })
        .eq('id', visitToReschedule.id)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Visit rescheduled successfully!');
      setIsRescheduleDialogOpen(false);
      setVisitToReschedule(null);
      fetchVisits(); // Refresh visits list
    } catch (err: any) {
      console.error("Error rescheduling visit:", err);
      toast.error(err.message || "Failed to reschedule visit.");
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Functions for Notes Dialog
  const openNotesDialog = (visit: Visit) => {
    setVisitForNotes(visit);
    setCurrentNotes(visit.notes || ""); // Load existing notes or start fresh
    setIsNotesDialogOpen(true);
  };

  const handleSaveAndConcludeVisit = async () => {
    if (!visitForNotes) return;
    setNotesSaving(true);
    try {
      const { error } = await supabase
        .from('visits')
        .update({
          notes: currentNotes,
          status: 'completed'
        })
        .eq('id', visitForNotes.id)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Visit notes saved and visit concluded!');
      setIsNotesDialogOpen(false);
      setVisitForNotes(null);
      setCurrentNotes("");
      fetchVisits(); // Refresh visits list
    } catch (err: any) {
      console.error("Error saving notes and concluding visit:", err);
      toast.error(err.message || "Failed to save notes.");
    } finally {
      setNotesSaving(false);
    }
  };
  
  // --- JSX for loading, error, no user, no visits states (no changes here) ---
  if (loading && visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading your visits...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Oops! Something went wrong.</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={fetchVisits} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Try Again
        </Button>
      </div>
    );
  }

  if (!userId && !loading) { 
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg text-muted-foreground">Please log in to view your visits.</p>
          <Button onClick={() => router.push('/login')} className="mt-4">
            Go to Login
          </Button>
        </div>
      );
  }

  if (visits.length === 0 && !loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <CalendarX2 className="h-16 w-16 text-muted-foreground mb-6" />
        <h2 className="text-2xl font-semibold mb-2">No Visits Found</h2>
        <p className="text-muted-foreground mb-6">You haven't booked any property visits yet.</p>
        <Button asChild>
          <Link href="/search">
            <Home className="mr-2 h-4 w-4" /> Explore Properties
          </Link>
        </Button>
      </div>
    );
  }
  // --- Main JSX for displaying visits ---
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Visits</h1>
        <p className="text-muted-foreground">
          Here are the property visits you've scheduled or completed.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visits.map((visit) => {
          const property = visit.properties; 
          const isCurrentlyCancelling = cancellingVisitId === visit.id;
          const visitDateObject = new Date(visit.visit_date);
          const visitTimePassed = isPast(visitDateObject);

          console.log(`[MyVisitsPage] Visit ID: ${visit.id}`);
          console.log(`  - Property: ${property?.title || 'N/A'}`);
          console.log(`  - Status: ${visit.status}`);
          console.log(`  - Visit Date (Raw): ${visit.visit_date}`);
          console.log(`  - Visit Date (Parsed): ${visitDateObject.toString()}`);
          console.log(`  - Is Past: ${visitTimePassed}`);

          return (
            <Card key={visit.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
              <CardHeader className="p-0 relative">
                <Link href={`/property/${encodeURIComponent(visit.property_id)}`} className="block aspect-[16/9] bg-muted overflow-hidden">
                  <div className="flex h-full w-full items-center justify-center bg-gray-200">
                    <Home className="h-12 w-12 text-gray-400" />
                  </div>
                </Link>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <Link href={`/property/${encodeURIComponent(visit.property_id)}`}>
                  <CardTitle className="text-lg font-semibold hover:text-primary transition-colors truncate" title={property?.title}>
                    {property?.title || 'Property Title Unavailable'}
                  </CardTitle>
                </Link>
                <div className="mt-3 space-y-1 text-sm">
                  <p>
                    <strong>Date:</strong> {format(visitDateObject, 'PPPp')}
                  </p>
                  <p>
                    <strong>Status:</strong> 
                    <span className={`ml-1 font-medium px-2 py-0.5 rounded-full text-xs
                      ${visit.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                        visit.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        visit.status === 'cancelling' ? 'bg-yellow-100 text-yellow-700 animate-pulse' :
                        'bg-gray-100 text-gray-700'}`}>
                      {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                    </span>
                  </p>
                  {visit.notes && visit.status === 'completed' && (
                    <p className="text-xs text-muted-foreground italic mt-1">Notes taken.</p>
                  )}
                  {visit.nda_accepted && <p className="text-xs text-green-600">NDA Accepted</p>}
                </div>
              </CardContent>
               <CardFooter className="p-4 border-t">
                {visit.status === 'scheduled' && (
                  <div className="flex flex-col gap-2 w-full">
                    {visitTimePassed ? (
                      <Button 
                        variant="default"
                        size="sm" 
                        className="w-full"
                        onClick={() => openNotesDialog(visit)}
                        disabled={isCurrentlyCancelling || rescheduleLoading || notesSaving}
                      >
                        <PlayCircle className="mr-2 h-4 w-4" /> Start Visit & Take Notes
                      </Button>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => openRescheduleDialog(visit)}
                          disabled={isCurrentlyCancelling || rescheduleLoading || notesSaving}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" /> Reschedule
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleCancelVisit(visit.id)}
                          disabled={isCurrentlyCancelling || rescheduleLoading || notesSaving}
                        >
                          {isCurrentlyCancelling ? 
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelling...</> :
                            <><CalendarX2 className="mr-2 h-4 w-4" /> Cancel Visit</>
                          }
                        </Button>
                      </>
                    )}
                  </div>
                )}
                {visit.status === 'completed' && (
                   <p className="text-sm text-green-600 flex items-center"><CalendarCheck className="mr-2 h-4 w-4"/> Visit Completed</p>
                )}
                 {visit.status === 'cancelled' && (
                   <p className="text-sm text-red-500 flex items-center"><CalendarX2 className="mr-2 h-4 w-4"/> Visit Cancelled</p>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Reschedule Dialog */}
      {visitToReschedule && (
        <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Reschedule Visit</DialogTitle>
              <DialogDescription>
                Select a new date and time for your visit to "{visitToReschedule.properties?.title || 'this property'}".
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="reschedule-date" className="text-sm font-medium">New Visit Date & Time</label>
                <DatePicker
                  id="reschedule-date"
                  selected={newVisitDate}
                  onChange={(date: Date | null) => setNewVisitDate(date)}
                  showTimeSelect
                  dateFormat="Pp"
                  minDate={new Date()} // Prevent selecting past dates
                  className="w-full p-2 border rounded-md"
                  placeholderText="Select new date and time"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" onClick={handleRescheduleSubmit} disabled={rescheduleLoading || !newVisitDate}>
                {rescheduleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm Reschedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Notes Dialog */}
      {visitForNotes && (
        <Dialog open={isNotesDialogOpen} onOpenChange={(isOpen) => { 
            if (notesSaving) return; // Prevent closing while saving
            setIsNotesDialogOpen(isOpen);
            if (!isOpen) {
                setVisitForNotes(null);
                setCurrentNotes("");
            }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Visit Notes: {visitForNotes.properties?.title || 'Property'}</DialogTitle>
              <DialogDescription>
                Record your observations and notes for this visit. This will also mark the visit as completed.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Textarea
                  id="visit-notes"
                  placeholder="Enter your notes here..."
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  rows={6}
                  disabled={notesSaving}
                />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={notesSaving}>Cancel</Button>
              </DialogClose>
              <Button type="submit" onClick={handleSaveAndConcludeVisit} disabled={notesSaving || !currentNotes.trim()}>
                {notesSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit3 className="mr-2 h-4 w-4" />}
                Save Notes & Conclude Visit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
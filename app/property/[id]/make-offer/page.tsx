'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, DollarSign, CreditCard, CalendarDays, Edit3, ShieldCheck, Info, CheckSquare, Square, Trash2, PlusCircle, FileText, AlertTriangle, Loader2, RefreshCw, FileWarning } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase'; // For fetching property details
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { isBefore, format as formatDateFns, parseISO } from 'date-fns';

type PropertyMinDetails = {
  title: string;
  currency: string; // Assuming property has a currency field, default to COP if not
};

// Type for individual installment within an offer
export interface OfferInstallment {
    date: string | null; // Stored as string yyyy-MM-dd
    amount: number;
    currency: 'COP' | 'USD' | 'EUR' | 'GBP';
    payment_method: 'cash' | 'crypto' | 'wire' | 'check' | '';
    approx_cop_value_at_offer_time?: string; 
}

// Type for the offer object retrieved from Supabase
export type Offer = {
    id: string;
    property_id: string;
    user_id: string;
    deal_id: string | null;
    created_at: string;
    total_amount: number;
    currency: Currency;
    payment_structure: 'full' | 'installments';
    installments: Array<{
        date: string | null;
        amount: number;
        currency: Currency;
        payment_method: string;
        approx_cop_value_at_offer_time?: string;
    }> | null;
    deeds_signing_date: string | null;
    registration_fees_arrangement: string | null;
    physical_delivery_date: string | null;
    offer_validity_date: string | null;
    request_promesa: boolean;
    request_option_contract: boolean;
    other_conditions: string | null;
    status: 'pending_review' | 'accepted' | 'rejected' | 'withdrawn' | 'negotiating' | 'countered_by_owner' | 'countered_by_offerer';
    version: number;
};

type Currency = 'COP' | 'USD' | 'EUR' | 'GBP';

// Type for form state of installments (uses Date objects for pickers)
interface FormInstallment {
  id: string;
  date: string | null;
  amount: string;
  currency: Currency;
  payment_method: string;
  approxCOP?: string;
}

// Mock conversion rates - replace with actual API call
const MOCK_RATES = {
  USD: 4000,
  EUR: 4300,
  GBP: 5000,
  COP: 1
};

// Property type needed for this page (to get owner_id)
interface PropertyForOffer extends PropertyMinDetails {
    user_id: string; // Property owner ID
}

interface OfferFormData {
  total_amount: string;
  currency: Currency;
  payment_structure: 'full' | 'installments';
  offer_validity_date: string | null;
  request_promesa: boolean;
  request_option_contract: boolean;
  other_conditions: string;
  installments: FormInstallment[];
  deeds_signing_date: string | null;
  registration_fees_arrangement: string;
  physical_delivery_date: string | null;
}

export default function MakeOfferPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [propertyDetails, setPropertyDetails] = useState<PropertyForOffer | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);

  const [existingOffer, setExistingOffer] = useState<Offer | null>(null);
  const [loadingOffer, setLoadingOffer] = useState(true); // For loading existing offer status
  const [isEditing, setIsEditing] = useState(false); // To toggle between view/edit existing offer

  // --- Offer Form State ---
  const [formData, setFormData] = useState<OfferFormData>({
    total_amount: '',
    currency: 'COP',
    payment_structure: 'full',
    offer_validity_date: null,
    request_promesa: false,
    request_option_contract: false,
    other_conditions: '',
    installments: [],
    deeds_signing_date: null,
    registration_fees_arrangement: '50/50_buyer_seller',
    physical_delivery_date: null
  });

  const [deedsSigningDate, setDeedsSigningDate] = useState<Date | undefined>();
  const [registrationFees, setRegistrationFees] = useState<string>('50/50_buyer_seller'); 
  const [physicalDeliveryDate, setPhysicalDeliveryDate] = useState<Date | undefined>();
  const [offerValidityDate, setOfferValidityDate] = useState<Date | undefined>();

  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [showUsufructoWarning, setShowUsufructoWarning] = useState(false);

  const isOfferEditable = existingOffer && ['pending_review', 'negotiating', 'countered_by_owner'].includes(existingOffer.status);
  const disableFormFields = submittingOffer || (isEditing && existingOffer && !isOfferEditable);
  // Submit button specific disable logic
  const disableSubmitButton = submittingOffer || loadingProperty || !currentUserId || (existingOffer && !isEditing && !isOfferEditable) || (isEditing && !isOfferEditable);

  const resetFormStates = () => {
    setFormData({
      total_amount: '',
      currency: 'COP',
      payment_structure: 'full',
      offer_validity_date: null,
      request_promesa: false,
      request_option_contract: false,
      other_conditions: '',
      installments: [],
      deeds_signing_date: null,
      registration_fees_arrangement: '50/50_buyer_seller',
      physical_delivery_date: null
    });
    setDeedsSigningDate(undefined);
    setRegistrationFees('50/50_buyer_seller');
    setPhysicalDeliveryDate(undefined);
    setOfferValidityDate(undefined);
    setIsEditing(false); // Exit editing mode
  };

  const populateFormWithOfferData = (offer: Offer) => {
    setFormData({
      total_amount: String(offer.total_amount),
      currency: offer.currency,
      payment_structure: offer.payment_structure,
      offer_validity_date: offer.offer_validity_date,
      request_promesa: offer.request_promesa,
      request_option_contract: offer.request_option_contract,
      other_conditions: offer.other_conditions || '',
      installments: offer.installments?.map(inst => ({
        id: crypto.randomUUID(),
        date: inst.date,
        amount: String(inst.amount),
        currency: inst.currency,
        payment_method: inst.payment_method,
        approxCOP: inst.approx_cop_value_at_offer_time
      })) || [],
      deeds_signing_date: offer.deeds_signing_date,
      registration_fees_arrangement: offer.registration_fees_arrangement || '50/50_buyer_seller',
      physical_delivery_date: offer.physical_delivery_date
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoadingProperty(true);
      setLoadingOffer(true);

      const { data: { user } } = await supabase.auth.getUser();
      const cUserId = user?.id || null;
      setCurrentUserId(cUserId);

      if (propertyId) {
        const { data: propData, error: propError } = await supabase
          .from('properties')
          .select('title, currency, user_id') // Ensure user_id (owner_id) is fetched
          .eq('id', propertyId)
          .single();
        if (propError) {
          console.error('Error fetching property details:', propError);
          toast.error('Failed to load property details.');
        } else {
          setPropertyDetails(propData as PropertyForOffer);
        }
        setLoadingProperty(false);

        if (cUserId) {
          const { data: offerData, error: offerError } = await supabase
            .from('offers')
            .select('*')
            .eq('property_id', propertyId)
            .eq('user_id', cUserId)
            .in('status', ['pending_review', 'negotiating', 'accepted', 'countered_by_owner'])
            .order('created_at', { ascending: false })
            .maybeSingle(); 

          if (offerError) {
            console.error('Error fetching existing offer:', offerError);
            toast.error('Could not check for existing offers.');
          } else {
            setExistingOffer(offerData as Offer | null);
          }
        }
      }
      setLoadingOffer(false);
    };
    fetchData();
  }, [propertyId]); // Re-fetch if propertyId changes

  useEffect(() => {
    if (physicalDeliveryDate && deedsSigningDate && isBefore(physicalDeliveryDate, deedsSigningDate)) {
      setShowUsufructoWarning(true);
    } else {
      setShowUsufructoWarning(false);
    }
  }, [physicalDeliveryDate, deedsSigningDate]);

  const updateApproxCOP = (installmentId: string, amountStr: string, currency: FormInstallment['currency']) => {
    const amountNum = parseFloat(amountStr);
    if (!isNaN(amountNum) && currency !== 'COP') {
      const rate = MOCK_RATES[currency];
      const converted = (amountNum * rate).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
      setFormData(prev => ({
        ...prev,
        installments: prev.installments?.map(inst =>
          inst.id === installmentId ? { ...inst, approxCOP: converted } : inst
        ) || []
      }));
    } else if (currency === 'COP') {
        setFormData(prev => ({
          ...prev,
          installments: prev.installments?.map(inst =>
            inst.id === installmentId ? { ...inst, approxCOP: undefined } : inst
          ) || []
        }));
    }
  };

  const handleAddInstallment = () => {
    setFormData(prev => ({
      ...prev,
      installments: [...prev.installments, {
        id: crypto.randomUUID(),
        date: null,
        amount: '',
        currency: 'COP',
        payment_method: ''
      }]
    }));
  };

  const handleRemoveInstallment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      installments: prev.installments?.filter(inst => inst.id !== id) || []
    }));
  };

  const handleInstallmentChange = (id: string, field: keyof Omit<FormInstallment, 'id' | 'approxCOP'>, value: any) => {
    setFormData(prev => ({
      ...prev,
      installments: prev.installments.map(inst => {
        if (inst.id === id) {
          const updatedInst = { ...inst, [field]: value };
          if (field === 'amount' || field === 'currency') {
            const amountNum = parseFloat(updatedInst.amount);
            if (!isNaN(amountNum) && amountNum > 0) {
              const currency = updatedInst.currency as Currency;
              const rate = MOCK_RATES[currency];
              const converted = (amountNum * rate).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
              updatedInst.approxCOP = converted;
            } else {
              updatedInst.approxCOP = undefined;
            }
          }
          return updatedInst;
        }
        return inst;
      })
    }));
  };
  
  const handleSubmitOffer = async () => {
    if (!currentUserId) {
      toast.error("You must be logged in to make an offer.");
      return;
    }
    if (!propertyId) {
      toast.error("Property ID is missing.");
      return;
    }
    if (!propertyDetails || !propertyDetails.user_id) {
      toast.error("Property owner details missing.");
      return;
    }
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      toast.error("Please enter a valid total offer amount.");
      return;
    }

    setSubmittingOffer(true);
    let dealIdToUse: string | null = null;

    try {
      // Check for an existing active deal for this property
      const { data: existingDeals, error: dealCheckError } = await supabase
        .from('deals')
        .select('id, status')
        .eq('property_id', propertyId)
        .in('status', ['active', 'negotiating'])
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (dealCheckError) throw dealCheckError;

      if (existingDeals && existingDeals.length > 0) {
        // Use the most recent active deal
        dealIdToUse = existingDeals[0].id;
      } else {
        // No active deal, create a new one
        const { data: newDeal, error: newDealError } = await supabase
          .from('deals')
          .insert({
            property_id: propertyId,
            buyer_id: currentUserId,
            seller_id: propertyDetails.user_id,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();
        
        if (newDealError) throw newDealError;
        if (!newDeal || !newDeal.id) throw new Error("Failed to create a new deal.");
        dealIdToUse = newDeal.id;
      }

      if (!dealIdToUse) {
        throw new Error("Could not establish a deal for this offer.");
      }

      // Create the offer
      const offerPayload: Omit<Offer, 'id' | 'created_at'> & { deal_id: string } = {
        property_id: propertyId,
        user_id: currentUserId,
        deal_id: dealIdToUse,
        total_amount: parseFloat(formData.total_amount),
        currency: formData.currency,
        payment_structure: formData.payment_structure,
        installments: formData.payment_structure === 'installments' ? 
          formData.installments.map(inst => ({ 
            date: inst.date ? (typeof inst.date === 'string' ? inst.date : formatDateFns(inst.date, 'yyyy-MM-dd')) : null,
            amount: parseFloat(inst.amount),
            currency: inst.currency,
            payment_method: inst.payment_method,
            approx_cop_value_at_offer_time: inst.approxCOP
          })) 
          : null,
        deeds_signing_date: formData.deeds_signing_date,
        registration_fees_arrangement: formData.registration_fees_arrangement,
        physical_delivery_date: formData.physical_delivery_date,
        offer_validity_date: formData.offer_validity_date,
        request_promesa: !!formData.request_promesa,
        request_option_contract: !!formData.request_option_contract,
        other_conditions: formData.other_conditions || null,
        status: existingOffer && isEditing ? existingOffer.status : 'pending_review',
        version: 1
      };

      let newOfferId: string | null = null;

      if (isEditing && existingOffer) {
        const updatePayload = { ...offerPayload, deal_id: existingOffer.deal_id || dealIdToUse }; 
        const { error } = await supabase.from('offers').update(updatePayload).eq('id', existingOffer.id).eq('user_id', currentUserId);
        if (error) throw error;
        newOfferId = existingOffer.id;
        toast.success('Offer updated successfully!');
        setIsEditing(false); 
      } else {
        const { data: newOffer, error } = await supabase.from('offers').insert(offerPayload).select('id').single();
        if (error) throw error;
        if (!newOffer || !newOffer.id) throw new Error("Failed to create offer.");
        newOfferId = newOffer.id;
        toast.success('Offer submitted successfully!');
      }

      // Update the deal with the current offer ID
      if (newOfferId) {
        const { error: updateDealError } = await supabase
          .from('deals')
          .update({ 
            current_offer_id: newOfferId,
            updated_at: new Date().toISOString()
          })
          .eq('id', dealIdToUse);

        if (updateDealError) {
          console.error('Error updating deal with current offer:', updateDealError);
          // Don't throw here, as the offer was created successfully
        }
      }

      // Navigate to the deal detail page using the consistent dealId
      router.push(`/my-deals/${dealIdToUse}`);

    } catch (error: any) {
      console.error('Error processing offer:', error);
      toast.error(`Failed to process offer: ${error.message}`);
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleWithdrawOffer = async () => {
    if (!existingOffer || !currentUserId) {
      toast.error("No offer to withdraw or user not identified.");
      return;
    }
    setSubmittingOffer(true); // Use submittingOffer for loading state on withdraw too
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: 'withdrawn' })
        .eq('id', existingOffer.id)
        .eq('user_id', currentUserId);
      
      if (error) throw error;
      toast.success("Offer withdrawn successfully.");
      setExistingOffer(null); // Clear existing offer state
      resetFormStates(); // Allow making a new offer
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error withdrawing offer:", error);
      toast.error(`Failed to withdraw offer: ${error.message}`);
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleCheckboxChange = (name: keyof Pick<OfferFormData, 'request_promesa' | 'request_option_contract'>) => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };
  
  // Initial Loading State
  if (loadingProperty || loadingOffer) { 
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="mr-2 h-8 w-8 animate-spin"/>Loading Offer Information...</div>;
  }

  // After loading, if user not identified, show error (should ideally not happen if page requires auth)
  if (!currentUserId) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
              <p className="text-xl text-red-500">Could not identify user. Please try logging in again.</p>
              <Button onClick={() => router.push('/login')} variant="outline" className="mt-4">
                  Go to Login
              </Button>
          </div>
      );
  }

  if (!propertyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-xl text-red-500">Property ID not found.</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  // If there's an existing offer and not in editing mode, show summary
  if (existingOffer && !isEditing) {
    const currentOfferIsEditable = ['pending_review', 'negotiating', 'countered_by_owner'].includes(existingOffer.status);
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-2xl">
        <div className="mb-6">
          <Link href={existingOffer.deal_id ? `/my-deals/${existingOffer.deal_id}` : `/property/${propertyId}`}>
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> 
              {existingOffer.deal_id ? 'Back to Deal' : 'Back to Property'}
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><FileWarning className="mr-2 h-6 w-6 text-amber-500" /> Your Existing Offer</CardTitle>
            <CardDescription>
              You have an active offer for {propertyDetails?.title || 'this property'}, submitted on {formatDateFns(parseISO(existingOffer.created_at), 'PPP p')}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p><strong>Status:</strong> <span className="capitalize font-medium">{existingOffer.status.replace('_',' ')}</span></p>
            <p><strong>Total Amount Offered:</strong> {existingOffer.total_amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
            {/* Could display more details here if needed */}
            <Separator />
            <div className="flex space-x-3 mt-4">
              <Button onClick={() => { populateFormWithOfferData(existingOffer); setIsEditing(true); }} className="flex-1" disabled={submittingOffer || !currentOfferIsEditable}>
                <Edit3 className="mr-2 h-4 w-4"/> Edit Offer
              </Button>
              <Button variant="destructive" onClick={handleWithdrawOffer} disabled={submittingOffer || !currentOfferIsEditable} className="flex-1">
                {submittingOffer ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                Withdraw Offer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If editing existing offer OR no existing offer, show the form:
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <Link href={existingOffer?.deal_id ? `/my-deals/${existingOffer.deal_id}` : `/property/${propertyId}`}>
          <Button variant="outline" disabled={submittingOffer}>
            <ArrowLeft className="mr-2 h-4 w-4" /> 
            {existingOffer?.deal_id ? 'Back to Deal' : 'Back to Property'}
          </Button>
        </Link>
        {isEditing && existingOffer && (
             <Button variant="outline" onClick={() => { setIsEditing(false); /* Do not resetFormStates here if user cancels edit of existing */}} className="ml-2" disabled={submittingOffer}>
                Cancel Edit
            </Button>
        )}
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{isEditing ? 'Edit Your Offer' : 'Make an Offer'}</CardTitle>
          {propertyDetails && <CardDescription>For property: {propertyDetails.title}</CardDescription>}
          {isEditing && existingOffer && <CardDescription className="mt-1 text-sm">You are editing your offer submitted on {formatDateFns(parseISO(existingOffer.created_at), 'PPP')}. Current status: {existingOffer.status.replace('_',' ')}.</CardDescription>}
        </CardHeader>
      </Card>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmitOffer(); }} className="space-y-8">
        {/* Section 1: Total Amount & Payment Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5 text-green-600"/>Payment Details</CardTitle>
            <CardDescription>Specify the total amount and how you plan to pay.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="totalAmount" className="text-base font-semibold">Total Offer Amount (COP)</Label>
              <Input 
                id="totalAmount"
                type="number"
                value={formData.total_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                placeholder="e.g., 300000000"
                required 
                className="mt-1"
                disabled={!!disableFormFields}
              />
            </div>
            <div>
              <Label className="text-base font-semibold">Payment Structure</Label>
              <RadioGroup 
                value={formData.payment_structure}
                onValueChange={(value: 'full' | 'installments') => setFormData(prev => ({ ...prev, payment_structure: value }))}
                className="mt-2 space-y-2"
                disabled={!!disableFormFields}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="fullPayment" />
                  <Label htmlFor="fullPayment" className="font-normal">Full Payment (Contado)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="installments" id="installmentsPayment" />
                  <Label htmlFor="installmentsPayment" className="font-normal">Payment in Installments (Cuotas)</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Installment Details (Conditional) */}
        {formData.payment_structure === 'installments' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><CreditCard className="mr-2 h-5 w-5 text-blue-600"/>Installment Plan</CardTitle>
              <CardDescription>Detail each payment installment. Amounts in foreign currencies will be shown with an approximate COP value based on current mock rates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.installments.map((installment, index) => (
                <Card key={installment.id} className="p-4 bg-slate-50 dark:bg-slate-800 shadow-sm">
                  <CardHeader className="p-0 mb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Installment {index + 1}</CardTitle>
                      {formData.installments.length > 1 && (
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveInstallment(installment.id)} 
                            className="text-red-500 hover:text-red-700 h-8 w-8"
                            disabled={!!disableFormFields}
                        >
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                        )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor={`inst-date-${installment.id}`}>Date</Label>
                            <DatePicker
                                id={`inst-date-${installment.id}`}
                                selected={installment.date ? (typeof installment.date === 'string' ? parseISO(installment.date) : installment.date) : null}
                                onChange={(date: Date | null) => handleInstallmentChange(installment.id, 'date', date || undefined)}
                                dateFormat="MMMM d, yyyy"
                                className="w-full p-2 border rounded-md mt-1"
                                placeholderText="Select payment date"
                                required
                                disabled={!!disableFormFields}
                            />
                        </div>
                        <div>
                            <Label htmlFor={`inst-amount-${installment.id}`}>Amount</Label>
                            <Input 
                                id={`inst-amount-${installment.id}`}
                                type="number"
                                value={installment.amount}
                                onChange={(e) => handleInstallmentChange(installment.id, 'amount', e.target.value)}
                                placeholder="e.g., 50000000"
                                required
                                className="mt-1"
                                disabled={!!disableFormFields}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor={`inst-currency-${installment.id}`}>Currency</Label>
                            <Select 
                                value={installment.currency}
                                onValueChange={(value: FormInstallment['currency']) => handleInstallmentChange(installment.id, 'currency', value)}
                                disabled={!!disableFormFields}
                            >
                                <SelectTrigger id={`inst-currency-${installment.id}`} className="mt-1">
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="COP">COP (Colombian Peso)</SelectItem>
                                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                                    <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                                </SelectContent>
                            </Select>
                            {installment.approxCOP && installment.currency !== 'COP' && (
                                <p className="text-xs text-muted-foreground mt-1">Approx. COP: {installment.approxCOP}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor={`inst-paymentMethod-${installment.id}`}>Payment Method</Label>
                            <Select 
                                value={installment.payment_method}
                                onValueChange={(value: FormInstallment['payment_method']) => handleInstallmentChange(installment.id, 'payment_method', value)}
                                disabled={!!disableFormFields}
                            >
                                <SelectTrigger id={`inst-paymentMethod-${installment.id}`} className="mt-1">
                                    <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="crypto">Crypto</SelectItem>
                                    <SelectItem value="wire">Wire Transfer</SelectItem>
                                    <SelectItem value="check">Check</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddInstallment} 
                className="mt-4 w-full"
                disabled={!!disableFormFields}
                >
                <PlusCircle className="mr-2 h-4 w-4"/> Add Another Installment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Section 3: Conditions and Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-purple-600"/>Conditions & Key Dates</CardTitle>
            <CardDescription>Specify important dates and conditions for your offer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="deedsSigningDate">Deeds Signing Date (Escritura)</Label>
                <DatePicker
                    id="deedsSigningDate"
                    selected={formData.deeds_signing_date ? (typeof formData.deeds_signing_date === 'string' ? parseISO(formData.deeds_signing_date) : formData.deeds_signing_date) : null}
                    onChange={(date: Date | null) => setFormData(prev => ({ 
                      ...prev, 
                      deeds_signing_date: date ? formatDateFns(date, 'yyyy-MM-dd') : null 
                    }))}
                    dateFormat="MMMM d, yyyy"
                    className="w-full p-2 border rounded-md mt-1"
                />
              </div>
              <div>
                <Label htmlFor="physicalDeliveryDate">Physical Delivery Date (Entrega)</Label>
                <DatePicker
                    id="physicalDeliveryDate"
                    selected={formData.physical_delivery_date ? (typeof formData.physical_delivery_date === 'string' ? parseISO(formData.physical_delivery_date) : formData.physical_delivery_date) : null}
                    onChange={(date: Date | null) => setFormData(prev => ({ 
                      ...prev, 
                      physical_delivery_date: date ? formatDateFns(date, 'yyyy-MM-dd') : null 
                    }))}
                    dateFormat="MMMM d, yyyy"
                    className="w-full p-2 border rounded-md mt-1"
                />
                {showUsufructoWarning && (
                    <p className="mt-2 text-sm text-orange-600 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1 inline-block" /> 
                        Warning: Delivery is before deeds signing. Consider an usufruct contract.
                    </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="registrationFees">Registration & Notarial Fees (Gastos Notariales y Registro)</Label>
              <Select 
                value={formData.registration_fees_arrangement} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, registration_fees_arrangement: value }))} 
                disabled={!!disableFormFields}
                >
                  <SelectTrigger id="registrationFees" className="mt-1">
                      <SelectValue placeholder="Select fee arrangement" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="50/50_buyer_seller">50% Buyer / 50% Seller (Standard)</SelectItem>
                      <SelectItem value="100_buyer">100% Buyer</SelectItem>
                      <SelectItem value="100_seller">100% Seller</SelectItem>
                      <SelectItem value="custom">Custom (Specify in other conditions)</SelectItem>
                  </SelectContent>
              </Select>
            </div>

            <div>
                <Label htmlFor="offerValidityDate">Offer Validity Date (Optional)</Label>
                <DatePicker
                    id="offerValidityDate"
                    selected={formData.offer_validity_date ? (typeof formData.offer_validity_date === 'string' ? parseISO(formData.offer_validity_date) : formData.offer_validity_date) : null}
                    onChange={(date: Date | null) => setFormData(prev => ({ 
                      ...prev, 
                      offer_validity_date: date ? formatDateFns(date, 'yyyy-MM-dd') : null 
                    }))}
                    dateFormat="MMMM d, yyyy"
                    className="w-full p-2 border rounded-md mt-1"
                />
            </div>
            
            <Separator/>

            <div className="space-y-3">
                <Label className="text-base font-semibold">Legal Agreements</Label>
                 <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="requestPromesa" 
                        checked={!!formData.request_promesa}
                        onCheckedChange={(checked) => setFormData(prev => ({ 
                          ...prev, 
                          request_promesa: checked === true 
                        }))}
                        disabled={!!disableFormFields}
                        />
                    <Label htmlFor="requestPromesa" className="font-normal flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-gray-600"/> Request Promesa de Compraventa Signing
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="requestOptionContract" 
                        checked={!!formData.request_option_contract}
                        onCheckedChange={(checked) => setFormData(prev => ({ 
                          ...prev, 
                          request_option_contract: checked === true 
                        }))}
                        disabled={!!disableFormFields}
                        />
                    <Label htmlFor="requestOptionContract" className="font-normal flex items-center">
                       <ShieldCheck className="mr-2 h-4 w-4 text-gray-600"/> Request Option Contract (Contrato de Opción) Signing
                    </Label>
                </div>
            </div>

            <div>
              <Label htmlFor="otherConditions">Other Conditions / Notes</Label>
              <Textarea 
                id="otherConditions"
                value={formData.other_conditions}
                onChange={(e) => setFormData(prev => ({ ...prev, other_conditions: e.target.value }))}
                placeholder="Specify any other terms, conditions, or clarifications for your offer..."
                className="mt-1 min-h-[100px]"
                disabled={!!disableFormFields}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Button 
            type="submit" 
            className="w-full py-3 text-lg"
            disabled={!!disableSubmitButton}
        >
            {submittingOffer ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {isEditing ? 'Updating Offer...' : 'Submitting Offer...'} </> : (isEditing ? 'Update Offer' : 'Submit Offer')}
        </Button>
      </form>
    </div>
  );
} 
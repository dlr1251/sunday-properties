// supabase/functions/process-visit-payment/index.ts
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  try {
    const { visit_id, amount } = await req.json();

    // Simulate payment processing (replace with Stripe or similar)
    const paymentReference = `txn_${Math.random().toString(36).slice(2)}`;

    // Update visit with payment details
    const { error } = await supabase
      .from('visits')
      .update({
        payment_status: 'completed',
        payment_reference: paymentReference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', visit_id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Placeholder: Send notification to requester and seller
    // e.g., use Supabase Edge Function to send email via SendGrid

    return new Response(JSON.stringify({ success: true, paymentReference }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
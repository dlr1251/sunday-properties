-- Drop existing tables if they exist
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS deals CASCADE;

-- Create deals table
CREATE TABLE deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
    current_offer_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    deal_type VARCHAR(50),
    final_price DECIMAL(12,2),
    final_currency VARCHAR(3),
    metadata JSONB
);

-- Create offers table with versioning support
CREATE TABLE offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_offer_id UUID REFERENCES offers(id),
    version INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'accepted', 'rejected', 'countered', 'withdrawn')),
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'COP',
    payment_structure VARCHAR(20) NOT NULL CHECK (payment_structure IN ('full', 'installments')),
    offer_validity_date TIMESTAMP WITH TIME ZONE,
    other_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB
);

-- Add foreign key constraint for current_offer_id in deals table
ALTER TABLE deals
ADD CONSTRAINT fk_current_offer
FOREIGN KEY (current_offer_id)
REFERENCES offers(id);

-- Create indexes
CREATE INDEX idx_deals_property_id ON deals(property_id);
CREATE INDEX idx_deals_buyer_id ON deals(buyer_id);
CREATE INDEX idx_deals_seller_id ON deals(seller_id);
CREATE INDEX idx_offers_deal_id ON offers(deal_id);
CREATE INDEX idx_offers_property_id ON offers(property_id);
CREATE INDEX idx_offers_user_id ON offers(user_id);
CREATE INDEX idx_offers_parent_offer_id ON offers(parent_offer_id);

-- Enable Row Level Security
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for deals
CREATE POLICY "Users can view their own deals"
    ON deals FOR SELECT
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create deals"
    ON deals FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own deals"
    ON deals FOR UPDATE
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Create RLS policies for offers
CREATE POLICY "Users can view offers for their deals"
    ON offers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM deals
            WHERE deals.id = offers.deal_id
            AND (deals.buyer_id = auth.uid() OR deals.seller_id = auth.uid())
        )
    );

CREATE POLICY "Users can create offers"
    ON offers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offers"
    ON offers FOR UPDATE
    USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER set_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
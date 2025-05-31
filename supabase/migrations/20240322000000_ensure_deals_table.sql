-- Check if deals table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'deals') THEN
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

        -- Create indexes
        CREATE INDEX idx_deals_property_id ON deals(property_id);
        CREATE INDEX idx_deals_buyer_id ON deals(buyer_id);
        CREATE INDEX idx_deals_seller_id ON deals(seller_id);

        -- Enable Row Level Security
        ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Users can view their own deals"
            ON deals FOR SELECT
            USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

        CREATE POLICY "Users can create deals"
            ON deals FOR INSERT
            WITH CHECK (auth.uid() = buyer_id);

        CREATE POLICY "Users can update their own deals"
            ON deals FOR UPDATE
            USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

        -- Create trigger for updated_at
        CREATE TRIGGER set_deals_updated_at
            BEFORE UPDATE ON deals
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    ELSE
        -- Add any missing columns if the table exists
        BEGIN
            -- Add current_offer_id if it doesn't exist
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                         WHERE table_schema = 'public' 
                         AND table_name = 'deals' 
                         AND column_name = 'current_offer_id') THEN
                ALTER TABLE deals ADD COLUMN current_offer_id UUID;
            END IF;

            -- Add completed_at if it doesn't exist
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                         WHERE table_schema = 'public' 
                         AND table_name = 'deals' 
                         AND column_name = 'completed_at') THEN
                ALTER TABLE deals ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
            END IF;

            -- Add expiry_date if it doesn't exist
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                         WHERE table_schema = 'public' 
                         AND table_name = 'deals' 
                         AND column_name = 'expiry_date') THEN
                ALTER TABLE deals ADD COLUMN expiry_date TIMESTAMP WITH TIME ZONE;
            END IF;

            -- Add deal_type if it doesn't exist
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                         WHERE table_schema = 'public' 
                         AND table_name = 'deals' 
                         AND column_name = 'deal_type') THEN
                ALTER TABLE deals ADD COLUMN deal_type VARCHAR(50);
            END IF;

            -- Add final_price if it doesn't exist
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                         WHERE table_schema = 'public' 
                         AND table_name = 'deals' 
                         AND column_name = 'final_price') THEN
                ALTER TABLE deals ADD COLUMN final_price DECIMAL(12,2);
            END IF;

            -- Add final_currency if it doesn't exist
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                         WHERE table_schema = 'public' 
                         AND table_name = 'deals' 
                         AND column_name = 'final_currency') THEN
                ALTER TABLE deals ADD COLUMN final_currency VARCHAR(3);
            END IF;

            -- Add metadata if it doesn't exist
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                         WHERE table_schema = 'public' 
                         AND table_name = 'deals' 
                         AND column_name = 'metadata') THEN
                ALTER TABLE deals ADD COLUMN metadata JSONB;
            END IF;
        END;
    END IF;
END $$; 
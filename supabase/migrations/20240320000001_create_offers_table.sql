¬-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own offers
CREATE POLICY "Users can view their own offers"
    ON offers FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to create offers
CREATE POLICY "Users can create offers"
    ON offers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own offers
CREATE POLICY "Users can update their own offers"
    ON offers FOR UPDATE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
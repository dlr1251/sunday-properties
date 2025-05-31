-- Add foreign key relationship between properties and profiles
ALTER TABLE properties
ADD CONSTRAINT fk_properties_user_id
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Add index for the foreign key
CREATE INDEX idx_properties_user_id ON properties(user_id);

-- Update RLS policies to use profiles instead of auth.users
DROP POLICY IF EXISTS "Allow authenticated users to create properties" ON properties;
CREATE POLICY "Allow authenticated users to create properties" ON properties
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update their own properties" ON properties;
CREATE POLICY "Allow users to update their own properties" ON properties
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete their own properties" ON properties;
CREATE POLICY "Allow users to delete their own properties" ON properties
    FOR DELETE
    USING (auth.uid() = user_id); 
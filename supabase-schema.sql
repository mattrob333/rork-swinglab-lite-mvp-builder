-- SwingLab Baseball Swing Analysis Tool
-- Supabase Database Schema Setup
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pro_swings table for metadata
CREATE TABLE IF NOT EXISTS public.pro_swings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Baseball player information
    player_name VARCHAR(100) NOT NULL UNIQUE,
    
    -- Video file information
    file_name VARCHAR(255) NOT NULL UNIQUE,
    file_size BIGINT,
    duration_seconds DECIMAL(10,2),
    
    -- Video metadata
    width INTEGER,
    height INTEGER,
    fps DECIMAL(5,2),
    
    -- Storage path in Supabase Storage
    storage_path VARCHAR(500) NOT NULL,
    
    -- Optional metadata
    description TEXT,
    tags TEXT[] -- Array of tags like ['power', 'home-run', 'mlb']
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pro_swings_player ON public.pro_swings(player_name);
CREATE INDEX IF NOT EXISTS idx_pro_swings_created ON public.pro_swings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_swings_tags ON public.pro_swings USING GIN(tags);

-- Create user_swings table for recorded amateur swings (optional for future use)
CREATE TABLE IF NOT EXISTS public.user_swings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User information (for future auth integration)
    user_id UUID, -- Will reference auth.users when auth is added
    
    -- Swing metadata
    swing_name VARCHAR(100),
    notes TEXT,
    
    -- Video file information
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    duration_seconds DECIMAL(10,2),
    
    -- Storage path in Supabase Storage
    storage_path VARCHAR(500) NOT NULL,
    
    -- Comparison data (optional)
    compared_with_pro_swing_id UUID REFERENCES public.pro_swings(id),
    
    -- Video metadata
    width INTEGER DEFAULT 720,
    height INTEGER DEFAULT 720,
    fps DECIMAL(5,2)
);

-- Create index for user swings
CREATE INDEX IF NOT EXISTS idx_user_swings_created ON public.user_swings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_swings_user ON public.user_swings(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to pro_swings table
CREATE TRIGGER update_pro_swings_updated_at 
    BEFORE UPDATE ON public.pro_swings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample MLB pro swing data
INSERT INTO public.pro_swings (player_name, file_name, storage_path, description, tags) VALUES
('Mike Trout', 'mike-trout.mp4', 'pro-swings/mike-trout.mp4', 'Angels superstar swing', ARRAY['power', 'mlb', 'angels']),
('Mookie Betts', 'mookie-betts.mp4', 'pro-swings/mookie-betts.mp4', 'Dodgers contact hitter', ARRAY['contact', 'mlb', 'dodgers']),
('Aaron Judge', 'aaron-judge.mp4', 'pro-swings/aaron-judge.mp4', 'Yankees power hitter', ARRAY['power', 'home-run', 'mlb', 'yankees']),
('Ronald Acuña Jr.', 'ronald-acuna.mp4', 'pro-swings/ronald-acuna.mp4', 'Braves speedster', ARRAY['speed', 'contact', 'mlb', 'braves']),
('Freddie Freeman', 'freddie-freeman.mp4', 'pro-swings/freddie-freeman.mp4', 'Dodgers clutch hitter', ARRAY['clutch', 'contact', 'mlb', 'dodgers'])
ON CONFLICT (player_name) DO NOTHING;

-- Set up Row Level Security (RLS) policies
ALTER TABLE public.pro_swings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_swings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to pro swings (for the app to work without auth)
CREATE POLICY "Public read access for pro swings" ON public.pro_swings
    FOR SELECT USING (true);

-- Allow authenticated users to manage their own user swings (for future auth)
CREATE POLICY "Users can manage their own swings" ON public.user_swings
    FOR ALL USING (auth.uid() = user_id);

-- Allow anonymous insert for user swings (for MVP without auth)
CREATE POLICY "Anonymous can insert user swings" ON public.user_swings
    FOR INSERT WITH CHECK (true);

-- Create storage bucket policies (run these in Supabase Dashboard > Storage)
-- Note: These need to be created in the Supabase Dashboard, not via SQL

/*
Storage Bucket Setup Instructions:
1. Go to Supabase Dashboard > Storage
2. Create bucket named: "swinglab-pro-swings"
3. Set bucket to Public
4. Create the following policies:

Policy 1: "Public read access"
- Operation: SELECT
- Policy: (bucket_id = 'swinglab-pro-swings')

Policy 2: "Authenticated upload access" 
- Operation: INSERT
- Policy: (bucket_id = 'swinglab-pro-swings' AND auth.role() = 'authenticated')

Policy 3: "Anonymous upload for MVP"
- Operation: INSERT  
- Policy: (bucket_id = 'swinglab-pro-swings')
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.pro_swings TO anon, authenticated;
GRANT ALL ON public.user_swings TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create helpful views for the app
CREATE OR REPLACE VIEW public.pro_swings_summary AS
SELECT 
    id,
    player_name,
    storage_path,
    duration_seconds,
    tags,
    created_at
FROM public.pro_swings
ORDER BY player_name;

-- Grant access to the view
GRANT SELECT ON public.pro_swings_summary TO anon, authenticated;

-- Success message
SELECT 'SwingLab database schema setup complete! 🎯⚾' as message;

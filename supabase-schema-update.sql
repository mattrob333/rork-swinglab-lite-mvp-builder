-- SwingLab Schema Update Script
-- Run this to update existing tables to remove swing_name field

-- First, drop the existing constraint that references swing_name
ALTER TABLE public.pro_swings DROP CONSTRAINT IF EXISTS pro_swings_player_swing_unique;

-- Drop the swing_name column if it exists
ALTER TABLE public.pro_swings DROP COLUMN IF EXISTS swing_name;

-- Add unique constraint to player_name if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'pro_swings_player_name_key' 
        AND table_name = 'pro_swings'
    ) THEN
        ALTER TABLE public.pro_swings ADD CONSTRAINT pro_swings_player_name_key UNIQUE (player_name);
    END IF;
END $$;

-- Clear existing sample data and insert new simplified data
DELETE FROM public.pro_swings WHERE player_name IN ('Mike Trout', 'Mookie Betts', 'Aaron Judge', 'Ronald Acuña Jr.', 'Freddie Freeman');

-- Insert updated sample data without swing_name
INSERT INTO public.pro_swings (player_name, file_name, storage_path, description, tags) VALUES
('Mike Trout', 'mike-trout.mp4', 'pro-swings/mike-trout.mp4', 'Angels superstar swing', ARRAY['power', 'mlb', 'angels']),
('Mookie Betts', 'mookie-betts.mp4', 'pro-swings/mookie-betts.mp4', 'Dodgers contact hitter', ARRAY['contact', 'mlb', 'dodgers']),
('Aaron Judge', 'aaron-judge.mp4', 'pro-swings/aaron-judge.mp4', 'Yankees power hitter', ARRAY['power', 'home-run', 'mlb', 'yankees']),
('Ronald Acuña Jr.', 'ronald-acuna.mp4', 'pro-swings/ronald-acuna.mp4', 'Braves speedster', ARRAY['speed', 'contact', 'mlb', 'braves']),
('Freddie Freeman', 'freddie-freeman.mp4', 'pro-swings/freddie-freeman.mp4', 'Dodgers clutch hitter', ARRAY['clutch', 'contact', 'mlb', 'dodgers'])
ON CONFLICT (player_name) DO UPDATE SET
    file_name = EXCLUDED.file_name,
    storage_path = EXCLUDED.storage_path,
    description = EXCLUDED.description,
    tags = EXCLUDED.tags,
    updated_at = NOW();

-- Update the view to remove swing_name reference
DROP VIEW IF EXISTS public.pro_swings_summary;
CREATE VIEW public.pro_swings_summary AS
SELECT 
    id,
    player_name,
    storage_path,
    duration_seconds,
    tags,
    created_at
FROM public.pro_swings
ORDER BY player_name;

-- Grant access to the updated view
GRANT SELECT ON public.pro_swings_summary TO anon, authenticated;

-- Success message
SELECT 'SwingLab schema updated successfully! No more swing types, just player names! 🎯⚾' as message;

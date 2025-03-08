-- Add stars column to chores table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chores' AND column_name = 'stars'
  ) THEN
    ALTER TABLE chores ADD COLUMN stars integer DEFAULT 3;
  END IF;
END $$;

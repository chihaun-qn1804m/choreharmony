/*
  # ChoreHarmony Database Schema

  1. New Tables
    - `users` - Stores user information and household membership
    - `households` - Stores household information and settings
    - `chores` - Stores chore definitions
    - `assignments` - Stores task assignments
    - `reward_requests` - Stores reward requests
    - `notifications` - Stores user notifications
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Create trigger for new user creation
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  household_id uuid,
  preferences text[] DEFAULT '{}',
  stars float DEFAULT 0,
  total_hardness_points float DEFAULT 0,
  role text DEFAULT 'Member',
  avatar text,
  is_house_owner boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create households table
CREATE TABLE IF NOT EXISTS households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  grading_enabled boolean DEFAULT true,
  chore_types text[] DEFAULT '{"Kitchen", "Bathroom", "Living Room", "Bedroom", "Outdoor"}',
  locations text[] DEFAULT '{"Kitchen", "Bathroom", "Living Room", "Bedroom", "Outdoor"}',
  invite_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint to users table
ALTER TABLE users
ADD CONSTRAINT fk_household
FOREIGN KEY (household_id)
REFERENCES households(id)
ON DELETE SET NULL;

-- Create chores table
CREATE TABLE IF NOT EXISTS chores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  frequency text DEFAULT 'Daily',
  hardness int DEFAULT 1,
  estimated_time int DEFAULT 15,
  type text,
  location text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(household, slug)
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chore uuid REFERENCES chores(id) ON DELETE CASCADE NOT NULL,
  assigned_to uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  assigned_date timestamptz DEFAULT now(),
  due_date timestamptz NOT NULL,
  start_time text,
  end_time text,
  skipped boolean DEFAULT false,
  status text DEFAULT 'pending',
  title text NOT NULL,
  description text,
  location text,
  created_at timestamptz DEFAULT now()
);

-- Create reward_requests table
CREATE TABLE IF NOT EXISTS reward_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Changed from 'user' to 'user_id'
  household uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  stars_spent float DEFAULT 0,
  title text NOT NULL,
  description text,
  cost float NOT NULL,
  is_approved boolean DEFAULT false,
  claimed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  read boolean DEFAULT false,
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Create policies for households table
CREATE POLICY "Users can view households they belong to"
  ON households
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their household"
  ON households
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
  );

CREATE POLICY "Owners can delete their household"
  ON households
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
  );

CREATE POLICY "Users can create households"
  ON households
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for chores table
CREATE POLICY "Users can view chores in their household"
  ON chores
  FOR SELECT
  TO authenticated
  USING (
    household IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert chores"
  ON chores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND household_id = household
      AND is_house_owner = true
    )
  );

CREATE POLICY "Owners can update chores"
  ON chores
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND household_id = household
      AND is_house_owner = true
    )
  );

CREATE POLICY "Owners can delete chores"
  ON chores
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND household_id = household
      AND is_house_owner = true
    )
  );

-- Create policies for assignments table
CREATE POLICY "Users can view assignments in their household"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN chores c ON c.household = u.household_id
      WHERE u.id = auth.uid()
      AND c.id = chore
    )
  );

CREATE POLICY "Users can update their own assignments"
  ON assignments
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid()
  );

CREATE POLICY "Owners can update any assignment"
  ON assignments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN chores c ON c.household = u.household_id
      WHERE u.id = auth.uid()
      AND u.is_house_owner = true
      AND c.id = chore
    )
  );

CREATE POLICY "Owners can insert assignments"
  ON assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN chores c ON c.household = u.household_id
      WHERE u.id = auth.uid()
      AND u.is_house_owner = true
      AND c.id = chore
    )
  );

CREATE POLICY "Owners can delete assignments"
  ON assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN chores c ON c.household = u.household_id
      WHERE u.id = auth.uid()
      AND u.is_house_owner = true
      AND c.id = chore
    )
  );

-- Create policies for reward_requests table
CREATE POLICY "Users can view reward requests in their household"
  ON reward_requests
  FOR SELECT
  TO authenticated
  USING (
    household IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reward requests"
  ON reward_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() -- Changed from 'user' to 'user_id'
  );

CREATE POLICY "Users can update their own reward requests"
  ON reward_requests
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() -- Changed from 'user' to 'user_id'
  );

CREATE POLICY "Owners can update any reward request"
  ON reward_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND household_id = household
      AND is_house_owner = true
    )
  );

-- Create policies for notifications table
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', 'User'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

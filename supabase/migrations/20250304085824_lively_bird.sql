/*
  # Schema Updates for ChoreHarmony

  This migration adds missing policies and ensures all tables have proper security.
  It checks for existing policies before creating them to avoid errors.
*/

-- Check for existing policies and create only if they don't exist
DO $$
BEGIN
  -- Create policies for users table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own data' AND tablename = 'users') THEN
    CREATE POLICY "Users can view their own data"
      ON users
      FOR SELECT
      TO authenticated
      USING (id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own data' AND tablename = 'users') THEN
    CREATE POLICY "Users can update their own data"
      ON users
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid());
  END IF;

  -- Create policies for households table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view households they belong to' AND tablename = 'households') THEN
    CREATE POLICY "Users can view households they belong to"
      ON households
      FOR SELECT
      TO authenticated
      USING (
        id IN (
          SELECT household_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can update their household' AND tablename = 'households') THEN
    CREATE POLICY "Owners can update their household"
      ON households
      FOR UPDATE
      TO authenticated
      USING (
        created_by = auth.uid()
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can delete their household' AND tablename = 'households') THEN
    CREATE POLICY "Owners can delete their household"
      ON households
      FOR DELETE
      TO authenticated
      USING (
        created_by = auth.uid()
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create households' AND tablename = 'households') THEN
    CREATE POLICY "Users can create households"
      ON households
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  -- Create policies for chores table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view chores in their household' AND tablename = 'chores') THEN
    CREATE POLICY "Users can view chores in their household"
      ON chores
      FOR SELECT
      TO authenticated
      USING (
        household IN (
          SELECT household_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can insert chores' AND tablename = 'chores') THEN
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
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can update chores' AND tablename = 'chores') THEN
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
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can delete chores' AND tablename = 'chores') THEN
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
  END IF;

  -- Create policies for assignments table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view assignments in their household' AND tablename = 'assignments') THEN
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
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own assignments' AND tablename = 'assignments') THEN
    CREATE POLICY "Users can update their own assignments"
      ON assignments
      FOR UPDATE
      TO authenticated
      USING (
        assigned_to = auth.uid()
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can update any assignment' AND tablename = 'assignments') THEN
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
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can insert assignments' AND tablename = 'assignments') THEN
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
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can delete assignments' AND tablename = 'assignments') THEN
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
  END IF;

  -- Create policies for reward_requests table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view reward requests in their household' AND tablename = 'reward_requests') THEN
    CREATE POLICY "Users can view reward requests in their household"
      ON reward_requests
      FOR SELECT
      TO authenticated
      USING (
        household IN (
          SELECT household_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert reward requests' AND tablename = 'reward_requests') THEN
    CREATE POLICY "Users can insert reward requests"
      ON reward_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id = auth.uid()
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own reward requests' AND tablename = 'reward_requests') THEN
    CREATE POLICY "Users can update their own reward requests"
      ON reward_requests
      FOR UPDATE
      TO authenticated
      USING (
        user_id = auth.uid()
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can update any reward request' AND tablename = 'reward_requests') THEN
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
  END IF;

  -- Create policies for notifications table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own notifications' AND tablename = 'notifications') THEN
    CREATE POLICY "Users can view their own notifications"
      ON notifications
      FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid()
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own notifications' AND tablename = 'notifications') THEN
    CREATE POLICY "Users can update their own notifications"
      ON notifications
      FOR UPDATE
      TO authenticated
      USING (
        user_id = auth.uid()
      );
  END IF;
END $$;

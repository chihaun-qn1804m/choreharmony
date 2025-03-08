/*
  # Add sample data for ChoreHarmony app
  
  This migration adds sample data to the database for testing and demonstration purposes.
  It includes:
  1. Sample users
  2. Sample household
  3. Sample chores
  4. Sample assignments
  5. Sample notifications
*/

-- Add sample household if it doesn't exist
DO $$
DECLARE
  household_id uuid;
  user1_id uuid := '00000000-0000-0000-0000-000000000001';
  user2_id uuid := '00000000-0000-0000-0000-000000000002';
  user3_id uuid := '00000000-0000-0000-0000-000000000003';
  chore1_id uuid;
  chore2_id uuid;
  chore3_id uuid;
  chore4_id uuid;
  user1_exists boolean;
  user2_exists boolean;
  user3_exists boolean;
BEGIN
  -- Create a sample household
  INSERT INTO households (name, slug, invite_code, chore_types, locations)
  VALUES ('Sample Home', 'sample-home', 'SAMPLE123', 
          ARRAY['Kitchen', 'Bathroom', 'Living Room', 'Bedroom', 'Outdoor'], 
          ARRAY['Kitchen', 'Bathroom', 'Living Room', 'Bedroom', 'Outdoor'])
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO household_id;
  
  -- Get the household ID if it already exists
  IF household_id IS NULL THEN
    SELECT id INTO household_id FROM households WHERE slug = 'sample-home';
  END IF;
  
  -- Check if users already exist in auth.users
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = 'john@example.com') INTO user1_exists;
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lisa@example.com') INTO user2_exists;
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mike@example.com') INTO user3_exists;
  
  -- Create sample users in auth.users if they don't exist
  IF NOT user1_exists THEN
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES (user1_id, 'john@example.com', '{"name": "John Smith"}'::jsonb);
  END IF;
  
  IF NOT user2_exists THEN
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES (user2_id, 'lisa@example.com', '{"name": "Lisa Johnson"}'::jsonb);
  END IF;
  
  IF NOT user3_exists THEN
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES (user3_id, 'mike@example.com', '{"name": "Mike Davis"}'::jsonb);
  END IF;
  
  -- Update or insert users in the public schema
  INSERT INTO users (id, email, name, household_id, stars, role, is_house_owner)
  VALUES 
    (user1_id, 'john@example.com', 'John Smith', household_id, 4.5, 'Owner', true),
    (user2_id, 'lisa@example.com', 'Lisa Johnson', household_id, 4.8, 'Member', false),
    (user3_id, 'mike@example.com', 'Mike Davis', household_id, 3.9, 'Member', false)
  ON CONFLICT (id) DO UPDATE SET
    household_id = EXCLUDED.household_id,
    stars = EXCLUDED.stars,
    role = EXCLUDED.role,
    is_house_owner = EXCLUDED.is_house_owner;
  
  -- Create sample chores
  INSERT INTO chores (id, household, name, slug, description, frequency, hardness, estimated_time, type, location)
  VALUES 
    (gen_random_uuid(), household_id, 'Mop the floor', 'mop-the-floor', 'Make sure to mop the corner', 'Daily', 2, 30, 'Cleaning', 'Living room'),
    (gen_random_uuid(), household_id, 'Do the dishes', 'do-the-dishes', 'Clean all dishes and put them away', 'Daily', 1, 20, 'Kitchen', 'Kitchen'),
    (gen_random_uuid(), household_id, 'Take out trash', 'take-out-trash', 'Take all trash bags to the dumpster', 'Weekly', 1, 10, 'Cleaning', 'Kitchen'),
    (gen_random_uuid(), household_id, 'Clean bathroom', 'clean-bathroom', 'Clean toilet, sink, and shower', 'Weekly', 3, 45, 'Cleaning', 'Bathroom')
  ON CONFLICT (household, slug) DO NOTHING;
  
  -- Get chore IDs
  SELECT id INTO chore1_id FROM chores WHERE household = household_id AND slug = 'mop-the-floor';
  SELECT id INTO chore2_id FROM chores WHERE household = household_id AND slug = 'do-the-dishes';
  SELECT id INTO chore3_id FROM chores WHERE household = household_id AND slug = 'take-out-trash';
  SELECT id INTO chore4_id FROM chores WHERE household = household_id AND slug = 'clean-bathroom';
  
  -- Create sample assignments for today
  INSERT INTO assignments (chore, assigned_to, due_date, start_time, end_time, status, title, description, location)
  VALUES 
    (chore1_id, user2_id, CURRENT_DATE, '06:00', '06:30', 'pending', 'Mop the floor', 'Make sure to mop the corner', 'Living room'),
    (chore1_id, user1_id, CURRENT_DATE, '12:00', '12:30', 'pending', 'Mop the floor', 'Make sure to mop the corner', 'Living room'),
    (chore2_id, user3_id, CURRENT_DATE, '19:00', '19:30', 'pending', 'Do the dishes', 'Clean all dishes and put them away', 'Kitchen'),
    (chore3_id, user1_id, CURRENT_DATE + INTERVAL '1 day', '09:00', '09:15', 'pending', 'Take out trash', 'Take all trash bags to the dumpster', 'Kitchen'),
    (chore4_id, user2_id, CURRENT_DATE + INTERVAL '2 days', '10:00', '10:45', 'pending', 'Clean bathroom', 'Clean toilet, sink, and shower', 'Bathroom')
  ON CONFLICT DO NOTHING;
  
  -- Create sample notifications
  INSERT INTO notifications (user_id, title, message, read)
  VALUES 
    (user1_id, 'New task assigned', 'You have been assigned to "Take out trash"', false),
    (user1_id, 'Task reminder', 'Don''t forget to mop the floor today', false),
    (user2_id, 'New task assigned', 'You have been assigned to "Mop the floor"', false),
    (user2_id, 'Task reminder', 'Don''t forget to clean the bathroom this week', false),
    (user3_id, 'New task assigned', 'You have been assigned to "Do the dishes"', false),
    (user1_id, 'Household update', 'Lisa completed her task "Clean bathroom"', true),
    (user2_id, 'Reward approved', 'Your reward request has been approved', true)
  ON CONFLICT DO NOTHING;
  
END $$;

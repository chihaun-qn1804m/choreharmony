export type User = {
  id: string;
  email: string;
  name: string;
  household_id: string | null;
  preferences: string[];
  stars: number;
  total_hardness_points: number;
  role: 'Owner' | 'Member';
  avatar: string | null;
  is_house_owner: boolean;
};

export type Household = {
  id: string;
  name: string;
  slug: string;
  created_by: string;
  grading_enabled: boolean;
  chore_types: string[];
  locations: string[];
  invite_code: string;
};

export type Chore = {
  id: string;
  household: string;
  name: string;
  slug: string;
  description: string;
  frequency: string;
  hardness: number;
  estimated_time: number;
  type: string;
  location: string;
  stars: number;
};

export type Assignment = {
  id: string;
  chore: string;
  assigned_to: string;
  assigned_date: string;
  due_date: string;
  start_time: string | null;
  end_time: string | null;
  skipped: boolean;
  status: 'pending' | 'completed';
  title: string;
  description: string;
  location: string;
  users?: any;
};

export type RewardRequest = {
  id: string;
  user_id: string;
  household: string;
  stars_spent: number;
  title: string;
  description: string;
  cost: number;
  is_approved: boolean;
  claimed_by: string | null;
};

export type Notification = {
  id: string;
  user_id: string;
  read: boolean;
  title: string;
  message: string;
  created_at: string;
};

export type CalendarViewType = 'week' | 'month';

export type TaskFilter = 'all' | 'mine' | 'completed' | 'overdue' | 'upcoming';

export type RewardFilter = 'all' | 'available' | 'claimed';

export type HouseholdTab = 'members' | 'rewards';

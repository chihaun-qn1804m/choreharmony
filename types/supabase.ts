export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          household_id: string | null
          preferences: string[]
          stars: number
          total_hardness_points: number
          role: 'Owner' | 'Member'
          avatar: string | null
          is_house_owner: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          household_id?: string | null
          preferences?: string[]
          stars?: number
          total_hardness_points?: number
          role?: 'Owner' | 'Member'
          avatar?: string | null
          is_house_owner?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          household_id?: string | null
          preferences?: string[]
          stars?: number
          total_hardness_points?: number
          role?: 'Owner' | 'Member'
          avatar?: string | null
          is_house_owner?: boolean
          created_at?: string
        }
      }
      households: {
        Row: {
          id: string
          name: string
          slug: string
          created_by: string
          grading_enabled: boolean
          chore_types: string[]
          locations: string[]
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_by: string
          grading_enabled?: boolean
          chore_types?: string[]
          locations?: string[]
          invite_code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_by?: string
          grading_enabled?: boolean
          chore_types?: string[]
          locations?: string[]
          invite_code?: string
          created_at?: string
        }
      }
      chores: {
        Row: {
          id: string
          household: string
          name: string
          slug: string
          description: string
          frequency: string
          hardness: number
          estimated_time: number
          type: string
          location: string
          created_at: string
          stars: number
        }
        Insert: {
          id?: string
          household: string
          name: string
          slug: string
          description: string
          frequency: string
          hardness: number
          estimated_time: number
          type: string
          location: string
          created_at?: string
          stars?: number
        }
        Update: {
          id?: string
          household?: string
          name?: string
          slug?: string
          description?: string
          frequency?: string
          hardness?: number
          estimated_time?: number
          type?: string
          location?: string
          created_at?: string
          stars?: number
        }
      }
      assignments: {
        Row: {
          id: string
          chore: string
          assigned_to: string
          assigned_date: string
          due_date: string
          start_time: string | null
          end_time: string | null
          skipped: boolean
          status: 'pending' | 'completed'
          title: string
          description: string
          location: string
          created_at: string
        }
        Insert: {
          id?: string
          chore: string
          assigned_to: string
          assigned_date: string
          due_date: string
          start_time?: string | null
          end_time?: string | null
          skipped?: boolean
          status?: 'pending' | 'completed'
          title: string
          description: string
          location: string
          created_at?: string
        }
        Update: {
          id?: string
          chore?: string
          assigned_to?: string
          assigned_date?: string
          due_date?: string
          start_time?: string | null
          end_time?: string | null
          skipped?: boolean
          status?: 'pending' | 'completed'
          title?: string
          description?: string
          location?: string
          created_at?: string
        }
      }
      reward_requests: {
        Row: {
          id: string
          user_id: string
          household: string
          stars_spent: number
          title: string
          description: string
          cost: number
          is_approved: boolean
          claimed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          household: string
          stars_spent: number
          title: string
          description: string
          cost: number
          is_approved?: boolean
          claimed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          household?: string
          stars_spent?: number
          title?: string
          description?: string
          cost?: number
          is_approved?: boolean
          claimed_by?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          read: boolean
          title: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          read?: boolean
          title: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          read?: boolean
          title?: string
          message?: string
          created_at?: string
        }
      }
    }
  }
}

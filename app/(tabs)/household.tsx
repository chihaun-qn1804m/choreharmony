import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const fetchData = async () => {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      console.error('No authenticated user found:', authError);
      // Redirect to login or handle session restoration
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      throw userError;
    }
    
    setCurrentUser(userData);
    
    if (userData.household_id) {
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .select('*')
        .eq('id', userData.household_id)
        .single();
        
      if (householdError) {
        console.error('Error fetching household data:', householdError);
        throw householdError;
      }
      
      setHousehold(householdData);
    }
  } catch (error) {
    console.error('Error fetching household data:', error);
  }
};

useEffect(() => {
  fetchData();
}, []);

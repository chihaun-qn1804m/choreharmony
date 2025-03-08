import { supabase } from '@/lib/supabase';

/**
 * Utility to test database connectivity and data retrieval
 */
export const databaseTester = {
  /**
   * Test basic connection to Supabase
   */
  testConnection: async () => {
    try {
      const { data, error } = await supabase.from('users').select('count');
      if (error) throw error;
      console.log('Connection successful:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Connection failed:', error);
      return { success: false, error };
    }
  },

  /**
   * Check authentication status
   */
  checkAuthStatus: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      const isAuthenticated = !!data?.session;
      console.log('Auth status:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
      
      return { 
        success: true, 
        isAuthenticated,
        userId: data?.session?.user?.id,
        expiresAt: data?.session?.expires_at
      };
    } catch (error) {
      console.error('Auth check failed:', error);
      return { success: false, error, isAuthenticated: false };
    }
  },

  /**
   * Test queries for all main tables
   */
  testAllTables: async () => {
    const tables = ['users', 'households', 'chores', 'assignments', 'reward_requests', 'notifications'];
    const results = {};
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(5);
          
        results[table] = { 
          success: !error,
          count: count || (data?.length || 0),
          hasData: (data?.length || 0) > 0,
          error: error?.message,
          sample: data?.slice(0, 1)
        };
      } catch (error) {
        results[table] = { 
          success: false, 
          error: error.message,
          count: 0,
          hasData: false
        };
      }
    }
    
    console.log('Table test results:', results);
    return results;
  },

  /**
   * Test a specific query with detailed logging
   */
  testSpecificQuery: async (tableName, query = {}) => {
    console.log(`Testing query on ${tableName} with:`, query);
    
    try {
      const startTime = Date.now();
      
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(10)
        .order('created_at', { ascending: false });
      
      const duration = Date.now() - startTime;
      
      console.log(`Query completed in ${duration}ms`);
      
      if (error) {
        console.error('Query error:', error);
        return { success: false, error, duration };
      }
      
      console.log(`Retrieved ${data?.length} records out of ${count} total`);
      
      // Check data structure
      if (data && data.length > 0) {
        const sampleRecord = data[0];
        const fields = Object.keys(sampleRecord);
        console.log('Record structure:', fields);
      }
      
      return { 
        success: true, 
        data, 
        count, 
        duration,
        hasData: (data?.length || 0) > 0
      };
    } catch (error) {
      console.error('Query execution error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Run a comprehensive test suite
   */
  runDiagnostics: async () => {
    console.log('Starting database diagnostics...');
    const startTime = Date.now();
    
    const results = {
      connection: await databaseTester.testConnection(),
      auth: await databaseTester.checkAuthStatus(),
      tables: await databaseTester.testAllTables(),
      userSpecific: null
    };
    
    // Only run user-specific tests if authenticated
    if (results.auth.isAuthenticated) {
      results.userSpecific = await databaseTester.testUserQuery();
    }
    
    const duration = Date.now() - startTime;
    console.log(`Diagnostics completed in ${duration}ms`);
    
    // Overall assessment
    const isConnectionOk = results.connection.success;
    const isAuthOk = results.auth.success;
    const areTablesOk = Object.values(results.tables).every(r => r.success);
    const isUserDataOk = results.userSpecific?.success || false;
    
    const overallStatus = {
      success: isConnectionOk && isAuthOk && areTablesOk,
      connectionOk: isConnectionOk,
      authOk: isAuthOk,
      tablesOk: areTablesOk,
      userDataOk: isUserDataOk,
      duration
    };
    
    console.log('Diagnostic summary:', overallStatus);
    
    return {
      ...results,
      summary: overallStatus
    };
  },

  /**
   * Test a user-specific query (requires authentication)
   */
  testUserQuery: async () => {
    try {
      // First check if user is authenticated
      const authCheck = await databaseTester.checkAuthStatus();
      if (!authCheck.isAuthenticated) {
        return { success: false, error: 'User not authenticated' };
      }
      
      const userId = authCheck.userId;
      
      // Test query for user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('User query error:', userError);
        return { success: false, error: userError };
      }
      
      // If user has household, test household query
      let householdResult = null;
      if (userData.household_id) {
        const { data: householdData, error: householdError } = await supabase
          .from('households')
          .select('*')
          .eq('id', userData.household_id)
          .single();
          
        householdResult = {
          success: !householdError,
          data: householdData,
          error: householdError?.message
        };
      }
      
      return {
        success: true,
        userData,
        householdResult,
        hasHousehold: !!userData.household_id
      };
    } catch (error) {
      console.error('User query test failed:', error);
      return { success: false, error: error.message };
    }
  }
};

export default databaseTester;

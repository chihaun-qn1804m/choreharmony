# Database Connectivity and Data Display Troubleshooting Guide

## Overview
This document provides a systematic approach to diagnosing and resolving database connectivity and data display issues in the ChoreHarmony application. Follow these steps in order to identify and fix problems with data retrieval and display.

## 1. Verify Database Connection Settings

### Connection String and Credentials
- **Check environment variables**:
  ```javascript
  // Verify these values in .env file
  EXPO_PUBLIC_SUPABASE_URL=https://rnfnzowtdcpmlyhchdhd.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

- **Verify Supabase client initialization**:
  ```javascript
  // From lib/supabase.ts
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

  export const supabase = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        storage: createCustomStorageAdapter(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    }
  );
  ```

### Test Connection
Run a simple query to test the connection:
```javascript
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count');
    if (error) throw error;
    console.log('Connection successful:', data);
    return true;
  } catch (error) {
    console.error('Connection failed:', error);
    return false;
  }
};
```

## 2. Confirm Database Server Accessibility

### Check Supabase Project Status
- Visit the [Supabase Dashboard](https://app.supabase.io/projects)
- Verify the project is active and not in maintenance mode
- Check for any reported incidents or outages

### Network Connectivity
- Ensure the device has internet connectivity
- Check if there are any network restrictions blocking access to Supabase
- Test with a different network if possible

## 3. Validate Database Queries

### Review Query Structure
Example query from the application:
```javascript
// From app/(tabs)/household.tsx
const fetchData = async () => {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser) {
      // Fetch current user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (userError) {
        throw userError;
      }
      
      setCurrentUser(userData);
      
      if (userData.household_id) {
        // Fetch household
        const { data: householdData, error: householdError } = await supabase
          .from('households')
          .select('*')
          .eq('id', userData.household_id)
          .single();
          
        if (householdError) {
          throw householdError;
        }
        
        setHousehold(householdData);
        
        // Fetch members
        const { data: membersData, error: membersError } = await supabase
          .from('users')
          .select('*')
          .eq('household_id', userData.household_id)
          .order('stars', { ascending: false });
          
        if (membersError) {
          throw membersError;
        }
        
        setMembers(membersData || []);
      }
    }
  } catch (error) {
    console.error('Error fetching household data:', error);
  }
};
```

### Test Queries in Isolation
Create a test function to run each query separately:
```javascript
const testQueries = async () => {
  try {
    // Test auth
    const { data: authData, error: authError } = await supabase.auth.getUser();
    console.log('Auth test:', authData, authError);
    
    // Test users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    console.log('Users test:', usersData, usersError);
    
    // Test households table
    const { data: householdsData, error: householdsError } = await supabase
      .from('households')
      .select('*')
      .limit(1);
    console.log('Households test:', householdsData, householdsError);
  } catch (error) {
    console.error('Query test failed:', error);
  }
};
```

## 4. Verify Data Exists in Expected Tables

### Check Table Structure
Verify the database schema matches what the application expects:
```sql
-- Expected tables from migrations
-- users, households, chores, assignments, reward_requests, notifications
```

### Inspect Table Contents
Run direct queries to check if data exists:
```javascript
const checkTableData = async () => {
  const tables = ['users', 'households', 'chores', 'assignments', 'reward_requests', 'notifications'];
  
  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .limit(1);
      
    console.log(`Table ${table}:`, { count, hasData: count > 0, error });
  }
};
```

## 5. Review API Endpoints and Routes

### Check Route Implementation
Verify that all routes are correctly implemented:
```javascript
// Example route structure in app/(tabs)/household.tsx
export default function HouseholdScreen() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  // Fetch data function implementation
  // ...
  
  return (
    <View>
      {/* Component rendering */}
    </View>
  );
}
```

### Verify Route Navigation
Check that navigation between routes works correctly:
```javascript
// Example navigation in app/(tabs)/_layout.tsx
<Tabs.Screen
  name="household"
  options={{
    title: 'Household',
    tabBarIcon: ({ color, size }) => (
      <Users size={size} color={color} />
    ),
  }}
/>
```

## 6. Inspect Frontend Data Fetching Logic

### Check Data Loading States
Verify loading states are handled correctly:
```javascript
// From app/(tabs)/household.tsx
const [loading, setLoading] = useState(true);

// In fetchData function
setLoading(true);
try {
  // Data fetching logic
} catch (error) {
  console.error('Error:', error);
} finally {
  setLoading(false);
}

// In render
return (
  <View>
    {loading ? (
      <ActivityIndicator size="large" color={COLORS.warmCoral} />
    ) : (
      // Render data
    )}
  </View>
);
```

### Verify Data Transformation
Check if data is being transformed correctly before display:
```javascript
// Example transformation
const formattedData = rawData.map(item => ({
  id: item.id,
  title: item.title,
  formattedDate: format(parseISO(item.due_date), 'MMMM d, yyyy')
}));
```

## 7. Check Console Logs for Error Messages

### Browser Console (Web)
- Open browser developer tools (F12)
- Check the Console tab for errors
- Look for network requests in the Network tab

### React Native Logs (Mobile)
- Check Expo logs in the terminal
- Use `console.log` statements to trace data flow
- Implement error boundaries to catch rendering errors

Example error boundary:
```javascript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, info) {
    console.error('Error boundary caught error:', error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return <Text>Something went wrong: {this.state.error.message}</Text>;
    }
    return this.props.children;
  }
}
```

## 8. Verify Database Connection Status

### Check Authentication Status
```javascript
const checkAuthStatus = async () => {
  const { data, error } = await supabase.auth.getSession();
  console.log('Auth session:', data, error);
  
  if (data?.session) {
    console.log('User is authenticated');
    return true;
  } else {
    console.log('User is not authenticated');
    return false;
  }
};
```

### Test Connection Persistence
```javascript
const testConnectionPersistence = async () => {
  // Test initial connection
  const initialTest = await testConnection();
  
  // Wait 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test again
  const secondTest = await testConnection();
  
  console.log('Connection persistence:', {
    initialTest,
    secondTest,
    persistent: initialTest && secondTest
  });
};
```

## 9. Check Data Format Consistency

### Verify Type Definitions
Check that TypeScript types match the database schema:
```typescript
// From types/index.ts
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
```

### Check Data Parsing
Verify that date parsing and other transformations are correct:
```javascript
// Example date parsing
const parsedDate = parseISO(item.due_date);
const isValid = !isNaN(parsedDate.getTime());
console.log('Date parsing:', { original: item.due_date, parsed: parsedDate, isValid });
```

## 10. Review Component Rendering Lifecycle

### Check Component Mounting
Verify that components are mounting correctly:
```javascript
useEffect(() => {
  console.log('Component mounted');
  fetchData();
  
  return () => {
    console.log('Component unmounted');
  };
}, []);
```

### Verify Re-rendering Logic
Check that components re-render when data changes:
```javascript
useEffect(() => {
  console.log('Data changed:', data);
  // Update derived state or perform side effects
}, [data]);
```

## 11. Inspect State Management Implementation

### Check State Updates
Verify that state is being updated correctly:
```javascript
const [data, setData] = useState([]);

const fetchData = async () => {
  try {
    const { data: result, error } = await supabase.from('table').select('*');
    if (error) throw error;
    
    console.log('Before state update:', data);
    setData(result);
    // State won't be updated until next render
    console.log('After setState call (still old data):', data);
    
    // Use a separate useEffect to log when state actually changes
  } catch (error) {
    console.error('Error:', error);
  }
};

useEffect(() => {
  console.log('State actually updated:', data);
}, [data]);
```

### Check Context Providers
If using Context API, verify providers are set up correctly:
```javascript
// Example context provider
const DataContext = createContext(null);

function DataProvider({ children }) {
  const [data, setData] = useState([]);
  
  const fetchData = async () => {
    // Implementation
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  return (
    <DataContext.Provider value={{ data, fetchData }}>
      {children}
    </DataContext.Provider>
  );
}
```

## 12. Additional Troubleshooting Steps

### Clear Local Storage
```javascript
const clearStorage = async () => {
  if (Platform.OS === 'web') {
    localStorage.clear();
  } else {
    await SecureStore.deleteItemAsync('supabase-auth');
  }
  console.log('Storage cleared');
};
```

### Retry with Exponential Backoff
Implement retry logic for network requests:
```javascript
const fetchWithRetry = async (fn, maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      console.log(`Attempt ${retries} failed:`, error);
      
      if (retries >= maxRetries) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

### Check for RLS Policies
Verify Row Level Security policies are not blocking access:
```sql
-- Example RLS policy check
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'users';
```

## Conclusion

By systematically working through this checklist, you should be able to identify and resolve most database connectivity and data display issues in the ChoreHarmony application. Remember to:

1. Start with the simplest tests (connection, authentication)
2. Isolate components of the system for testing
3. Use console logging strategically
4. Check both client and server-side issues
5. Verify data at each step of the pipeline from database to UI

If issues persist after completing this checklist, consider reaching out to Supabase support or reviewing the application architecture for potential design issues.

/**
 * Utility for consistent error logging and handling
 */
export const errorLogger = {
  /**
   * Log an error with context information
   */
  logError: (error: any, context: string, additionalInfo: any = {}) => {
    const timestamp = new Date().toISOString();
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || 'UNKNOWN';
    const errorDetails = error?.details || '';
    const stack = error?.stack || '';
    
    // Format the error for console
    console.error(`[${timestamp}] ERROR in ${context}:`, {
      message: errorMessage,
      code: errorCode,
      details: errorDetails,
      ...additionalInfo
    });
    
    // Only log stack trace in development
    if (__DEV__) {
      console.error('Stack trace:', stack);
    }
    
    // Return formatted error for potential display to user
    return {
      message: errorMessage,
      code: errorCode,
      context,
      timestamp
    };
  },
  
  /**
   * Format a user-friendly error message
   */
  getUserFriendlyMessage: (error: any) => {
    // Handle Supabase specific errors
    if (error?.code) {
      switch (error.code) {
        case 'PGRST116':
          return 'No data found. The requested resource may not exist.';
        case '23505':
          return 'This record already exists.';
        case '23503':
          return 'This operation failed because it references a missing record.';
        case '42P01':
          return 'Database configuration error. Please contact support.';
        case 'PGRST301':
          return 'You don\'t have permission to access this resource.';
        case 'auth/invalid-email':
          return 'The email address is invalid.';
        case 'auth/user-not-found':
          return 'No account found with this email address.';
        case 'auth/wrong-password':
          return 'Incorrect password. Please try again.';
        default:
          // Fall through to generic message
      }
    }
    
    // Generic messages based on error text
    const errorText = error?.message?.toLowerCase() || '';
    
    if (errorText.includes('network') || errorText.includes('connection')) {
      return 'Network connection error. Please check your internet connection.';
    }
    
    if (errorText.includes('timeout')) {
      return 'The request timed out. Please try again.';
    }
    
    if (errorText.includes('permission') || errorText.includes('access')) {
      return 'You don\'t have permission to perform this action.';
    }
    
    if (errorText.includes('not found')) {
      return 'The requested information could not be found.';
    }
    
    // Default fallback message
    return 'An unexpected error occurred. Please try again later.';
  },
  
  /**
   * Handle an error with logging and return user-friendly message
   */
  handleError: (error: any, context: string, additionalInfo: any = {}) => {
    // Log the error
    this.logError(error, context, additionalInfo);
    
    // Return user-friendly message
    return this.getUserFriendlyMessage(error);
  },
  
  /**
   * Create an error boundary component
   */
  createErrorBoundary: (Component: React.ComponentType<any>) => {
    return class ErrorBoundary extends React.Component {
      state = { hasError: false, error: null };
      
      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }
      
      componentDidCatch(error, info) {
        this.logError(error, 'ErrorBoundary', { componentStack: info.componentStack });
      }
      
      render() {
        if (this.state.hasError) {
          return (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Something went wrong</Text>
              <Text style={styles.errorMessage}>
                {this.getUserFriendlyMessage(this.state.error)}
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => this.setState({ hasError: false })}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          );
        }
        
        return <Component {...this.props} />;
      }
    };
  }
};

// Styles for error boundary
const styles = {
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8'
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e74c3c'
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333'
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500'
  }
};

export default errorLogger;

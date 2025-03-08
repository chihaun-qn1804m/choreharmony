import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { databaseTester } from '@/utils/databaseTester';
import { COLORS } from '@/constants/Colors';
import { Redirect } from 'expo-router';

export default function TestConnectionScreen() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setLoading(true);
    try {
      const result = await databaseTester.testConnection();
      setConnectionStatus(result.success ? 'success' : 'error');
      setConnectionDetails(result);
      
      if (result.success) {
        // If connection is successful, run more tests
        const diagnostics = await databaseTester.runDiagnostics();
        setTestResults(diagnostics);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionStatus('error');
      setConnectionDetails({ error });
    } finally {
      setLoading(false);
    }
  };

  const renderStatusIndicator = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={COLORS.warmCoral} />;
    }

    if (connectionStatus === 'success') {
      return (
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, styles.successIndicator]} />
          <Text style={styles.statusText}>Connection Successful</Text>
        </View>
      );
    }

    return (
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, styles.errorIndicator]} />
        <Text style={styles.statusText}>Connection Failed</Text>
      </View>
    );
  };

  const renderTestResults = () => {
    if (!testResults) return null;

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.sectionTitle}>Diagnostic Results</Text>
        
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Connection</Text>
          <Text style={[
            styles.resultValue, 
            testResults.summary.connectionOk ? styles.successText : styles.errorText
          ]}>
            {testResults.summary.connectionOk ? 'OK' : 'Failed'}
          </Text>
        </View>
        
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Authentication</Text>
          <Text style={[
            styles.resultValue, 
            testResults.summary.authOk ? styles.successText : styles.errorText
          ]}>
            {testResults.summary.authOk ? 'OK' : 'Failed'}
          </Text>
        </View>
        
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Tables</Text>
          <Text style={[
            styles.resultValue, 
            testResults.summary.tablesOk ? styles.successText : styles.errorText
          ]}>
            {testResults.summary.tablesOk ? 'OK' : 'Failed'}
          </Text>
        </View>
        
        <Text style={styles.sectionTitle}>Table Status</Text>
        {Object.entries(testResults.tables).map(([tableName, result]: [string, any]) => (
          <View key={tableName} style={styles.tableResultCard}>
            <Text style={styles.tableName}>{tableName}</Text>
            <View style={styles.tableResultDetails}>
              <Text style={styles.tableResultText}>
                Status: <Text style={result.success ? styles.successText : styles.errorText}>
                  {result.success ? 'OK' : 'Error'}
                </Text>
              </Text>
              <Text style={styles.tableResultText}>Records: {result.count || 0}</Text>
              {result.error && (
                <Text style={styles.errorMessage}>{result.error}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (connectionStatus === 'success' && !loading && testResults?.summary.success) {
    // If all tests pass, redirect to the main app
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Connection Test</Text>
      
      {renderStatusIndicator()}
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderTestResults()}
        
        {connectionStatus === 'error' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorMessage}>
              {connectionDetails?.error?.message || 'Failed to connect to Supabase'}
            </Text>
            <Text style={styles.errorHint}>
              Please check your Supabase URL and API key in the .env file.
            </Text>
          </View>
        )}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={testConnection}
        disabled={loading}
      >
        <Text style={styles.retryButtonText}>
          {loading ? 'Testing...' : 'Retry Connection Test'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.pureWhite,
    padding: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.deepCharcoal,
    marginTop: 60,
    marginBottom: 30,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  successIndicator: {
    backgroundColor: COLORS.success,
  },
  errorIndicator: {
    backgroundColor: COLORS.error,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: COLORS.deepCharcoal,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  resultsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: COLORS.deepCharcoal,
    marginBottom: 12,
    marginTop: 20,
  },
  resultCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.deepCharcoal,
  },
  resultValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  successText: {
    color: COLORS.success,
  },
  errorText: {
    color: COLORS.error,
  },
  tableResultCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  tableName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.deepCharcoal,
    marginBottom: 8,
  },
  tableResultDetails: {
    marginLeft: 8,
  },
  tableResultText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.deepCharcoal,
    marginBottom: 4,
  },
  errorContainer: {
    backgroundColor: COLORS.warmCoralLight,
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  errorTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: COLORS.error,
    marginBottom: 8,
  },
  errorMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.error,
    marginBottom: 8,
  },
  errorHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.deepCharcoal,
  },
  retryButton: {
    backgroundColor: COLORS.warmCoral,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  retryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.pureWhite,
  },
});

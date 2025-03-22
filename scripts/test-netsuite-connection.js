#!/usr/bin/env node
/**
 * Test script to verify NetSuite connection
 * Run with: node scripts/test-netsuite-connection.js
 */

const { makeRequest } = require('@fye/netsuite-rest-api');

// Check if we have all required environment variables
const requiredEnvVars = [
  'netsuite_hostname',
  'netsuite_account_id',
  'netsuite_consumerKey',
  'netsuite_consumerSecret',
  'netsuite_tokenKey',
  'netsuite_tokenSecret'
];

// Validate environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  process.exit(1);
}

// Configure NetSuite connection
const config = {
  // Format the hostname correctly without protocol in the host variable
  netsuiteApiHost: `${process.env.netsuite_account_id}.${process.env.netsuite_hostname.replace(/^https?:\/\//, '')}`,
  consumerKey: process.env.netsuite_consumerKey,
  consumerSecret: process.env.netsuite_consumerSecret,
  netsuiteAccountId: process.env.netsuite_account_id,
  netsuiteTokenKey: process.env.netsuite_tokenKey,
  netsuiteTokenSecret: process.env.netsuite_tokenSecret,
  netsuiteQueryLimit: 1,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-NetSuite-PropertyNameValidation': 'strict'
  }
};

// Create a simple REST API request to test authentication
// Using a simple GET request to the record endpoint
const requestData = {
  method: 'GET',
  requestType: 'record',
  path: 'services/rest/record/v1/account?limit=1',
  // No need to specify headers here as they're added by the makeRequest function
};

// Test the connection with detailed debugging
async function testConnection() {
  console.log('Testing NetSuite connection...');
  
  // Debug information
  console.log('Debug information:');
  console.log('- NetSuite API Host:', config.netsuiteApiHost);
  console.log('- Account ID:', config.netsuiteAccountId);
  console.log('- Request path:', requestData.path);
  console.log('- Consumer Key length:', config.consumerKey?.length || 0);
  console.log('- Token Key length:', config.netsuiteTokenKey?.length || 0);
  
  try {
    const response = await makeRequest(config, requestData);
    
    // Always show response status code
    console.log(`Response status: ${response.statusCode}`);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log('✅ Successfully connected to NetSuite!');
      console.log(`Response includes data:`, !!response.body);
      
      // Additional debug info for successful responses
      console.log('Response headers:', response.headers);
      if (response.body) {
        const bodySample = typeof response.body === 'object' 
          ? JSON.stringify(response.body).substring(0, 200) 
          : String(response.body).substring(0, 200);
        console.log('Response body sample:', bodySample + '...');
      }
    } else {
      console.error('❌ Connection failed with status code:', response.statusCode);
      
      // Parse authentication errors from www-authenticate header
      if (response.statusCode === 401 && response.headers['www-authenticate']) {
        const authHeader = response.headers['www-authenticate'];
        console.error('Authentication header:', authHeader);
        
        // Extract error details
        const errorMatch = authHeader.match(/error="([^"]+)"/);
        const errorDescMatch = authHeader.match(/error_description="([^"]+)"/);
        const realmMatch = authHeader.match(/realm="([^"]+)"/);
        
        if (errorMatch || errorDescMatch || realmMatch) {
          console.error('\nAuthentication Error Details:');
          if (realmMatch) console.error(`- Realm: ${realmMatch[1]}`);
          if (errorMatch) console.error(`- Error Type: ${errorMatch[1]}`);
          if (errorDescMatch) console.error(`- Error Description: ${errorDescMatch[1]}`);
          
          console.error('\nTroubleshooting Steps:');
          console.error('1. Verify your NetSuite hostname format (should be "suitetalk.api.netsuite.com" without protocol)');
          console.error('2. Confirm your account ID is correct');
          console.error('3. Check that your OAuth tokens have proper permissions in NetSuite');
          console.error('4. Ensure your integration record in NetSuite is properly configured');
        }
      }
      
      // Show response body for error details
      if (response.body) {
        console.error('\nResponse Body:');
        console.error(JSON.stringify(response.body, null, 2));
      }
    }
    
    // Exit with appropriate code based on response status
    process.exit(response.statusCode >= 200 && response.statusCode < 300 ? 0 : 1);
  } catch (error) {
    console.error('❌ Failed to connect to NetSuite:');
    console.error(error.message || error);
    
    // Additional debug info for errors
    console.error('\nError Details:');
    if (error.response) {
      console.error('- Response status:', error.response.statusCode);
      console.error('- Response headers:', error.response.headers);
      
      if (error.response.body) {
        console.error('- Response body:', JSON.stringify(error.response.body, null, 2));
      }
    }
    
    console.error('\nTroubleshooting Steps:');
    console.error('1. Check your network connection');
    console.error('2. Verify all environment variables are set correctly');
    console.error('3. Ensure your NetSuite account has API access enabled');
    console.error('4. Try running with DEBUG=1 for more detailed logs: DEBUG=1 node scripts/test-netsuite-connection.js');
    
    process.exit(1);
  }
}

// Run the test
testConnection();

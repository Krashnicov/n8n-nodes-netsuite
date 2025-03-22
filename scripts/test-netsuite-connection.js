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
  
  try {
    const response = await makeRequest(config, requestData);
    console.log('✅ Successfully connected to NetSuite!');
    console.log(`Response status: ${response.statusCode}`);
    console.log(`Response includes data:`, !!response.body);
    
    // Additional debug info for successful responses
    if (process.env.DEBUG) {
      console.log('Response headers:', response.headers);
      console.log('Response body sample:', JSON.stringify(response.body).substring(0, 200) + '...');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to connect to NetSuite:');
    console.error(error.message || error);
    
    // Additional debug info for errors
    if (process.env.DEBUG) {
      console.error('Error details:', error);
      if (error.response) {
        console.error('Response status:', error.response.statusCode);
        console.error('Response headers:', error.response.headers);
      }
    }
    
    process.exit(1);
  }
}

// Run the test
testConnection();

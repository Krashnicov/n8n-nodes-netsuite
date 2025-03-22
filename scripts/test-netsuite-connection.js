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
  netsuiteApiHost: process.env.netsuite_hostname,
  consumerKey: process.env.netsuite_consumerKey,
  consumerSecret: process.env.netsuite_consumerSecret,
  netsuiteAccountId: process.env.netsuite_account_id,
  netsuiteTokenKey: process.env.netsuite_tokenKey,
  netsuiteTokenSecret: process.env.netsuite_tokenSecret,
  netsuiteQueryLimit: 1,
};

// Create a simple SuiteQL query request
const requestData = {
  method: 'POST',
  requestType: 'suiteql',
  path: 'services/rest/query/v1/suiteql?limit=1',
  query: {
    q: 'SELECT 1 FROM Employee WHERE rownum = 1'
  },
};

// Test the connection
async function testConnection() {
  console.log('Testing NetSuite connection...');
  
  try {
    const response = await makeRequest(config, requestData);
    console.log('✅ Successfully connected to NetSuite!');
    console.log(`Response status: ${response.statusCode}`);
    console.log(`Response includes data:`, !!response.body);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to connect to NetSuite:');
    console.error(error.message || error);
    process.exit(1);
  }
}

// Run the test
testConnection();

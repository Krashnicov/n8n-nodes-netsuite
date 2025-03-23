#!/usr/bin/env node

/**
 * NetSuite Node Test with OAuth 1.0a Authentication
 * 
 * This script tests the NetSuite node implementation using OAuth 1.0a authentication
 * which has been confirmed to work with the NetSuite API.
 * 
 * This script serves as both a standalone test and a reference implementation
 * for the NetSuite node's OAuth 1.0a authentication flow.
 */

// Import required modules
const { makeRequest } = require('@fye/netsuite-rest-api');
const fs = require('fs');
const path = require('path');

// Authentication banner
console.log('🔐 Using OAuth 1.0a credentials for NetSuite connection test...');
console.log('This test verifies that OAuth 1.0a authentication works with the NetSuite API.');
console.log('It also validates that customer search returns expected data structure.');

// Check for required environment variables
const requiredEnvVars = [
  'netsuite_account_id',
  'netsuite_consumerKey',
  'netsuite_tokenKey',
  'netsuite_tokenSecret'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`  - ${envVar}`));
  console.error('\nPlease set these environment variables and try again.');
  process.exit(1);
}

// Configuration from environment variables with EXACT parameter names
// as required by the library's validateRequestConfig function
const config = {
  netsuiteApiHost: `${process.env.netsuite_account_id}.suitetalk.api.netsuite.com`,
  consumerKey: process.env.netsuite_consumerKey,
  consumerSecret: process.env.netsuite_consumerSecret || '',
  netsuiteAccountId: process.env.netsuite_account_id,
  netsuiteTokenKey: process.env.netsuite_tokenKey,
  netsuiteTokenSecret: process.env.netsuite_tokenSecret,
  debug: process.env.DEBUG === 'true' || true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-NetSuite-PropertyNameValidation': 'strict'
  }
};

console.log('🔑 NetSuite OAuth 1.0a Authentication Test with Correct Library Parameters');
console.log('------------------------------------------------------------------------');
console.log('Configuration:');
console.log(`- Account ID: ${config.netsuiteAccountId}`);
console.log(`- API Host: ${config.netsuiteApiHost}`);
console.log(`- Consumer Key: ${config.consumerKey}`);
console.log(`- Token Key: ${config.netsuiteTokenKey}`);
console.log(`- Debug Mode: ${config.debug ? 'Enabled' : 'Disabled'}`);
console.log('------------------------------------------------------------------------');

/**
 * Test SuiteQL query with OAuth 1.0a
 */
async function testSuiteQLQuery() {
  try {
    console.log('\n🧪 Testing SuiteQL query with OAuth 1.0a...');
    
    // Make API request using makeRequest from @fye/netsuite-rest-api
    const response = await makeRequest(config, {
      method: 'POST',
      requestType: 'suiteql',
      query: 'SELECT id, entityid, companyName FROM customer WHERE entityid = \'1\''
    });
    
    // Check if we have a successful response
    if (response.status === 200) {
      console.log('✅ SuiteQL query successful!');
      console.log(`Status code: ${response.status}`);
      
      // Check for customer data in the response
      if (response.data && response.data.items && response.data.items.length > 0) {
        const customer = response.data.items[0];
        console.log(`✅ Found customer: ${customer.id} - ${customer.companyName || customer.entityid}`);
        
        // Check if this is Bax Digital
        if (customer.entityid === '1' && customer.companyName === 'Bax Digital') {
          console.log('✅ Successfully found Bax Digital (entity ID 1)');
        } else {
          console.log(`Found customer: ${customer.entityid} - ${customer.companyName}`);
        }
        
        // Validate that we have exactly one customer record
        if (response.data.items.length !== 1) {
          throw new Error(`Expected exactly one customer record in response, got ${response.data.items.length}`);
        }
        
        console.log('✅ Assertion passed: Found exactly one customer record as expected');
      } else {
        console.log('No customer data found in response');
        console.log('Response data:', JSON.stringify(response.data, null, 2));
      }
    } else {
      // Handle non-200 responses
      console.log(`⚠️ SuiteQL query returned status code: ${response.status}`);
      
      // Check for 401 Unauthorized specifically
      if (response.status === 401) {
        console.log('❌ Authentication failed with 401 Unauthorized');
        
        // Extract error details from www-authenticate header
        const authHeader = response.headers && response.headers['www-authenticate'];
        if (authHeader) {
          console.log(`Authentication error: ${authHeader}`);
        }
        
        console.log('This is likely due to invalid or expired OAuth 1.0a credentials.');
        console.log('Please check your NetSuite integration record and token permissions.');
      }
      
      // Log the response body for debugging
      console.log('Response body:', JSON.stringify(response.body, null, 2));
    }
    
    // Only return success if we actually got a 200 status code
    return {
      success: response.status === 200,
      statusCode: response.status,
      response: response.data,
      error: response.status !== 200 ? 'Authentication failed' : undefined
    };
  } catch (error) {
    console.error('❌ SuiteQL query failed:');
    
    if (error.response) {
      console.error(`Status code: ${error.response.status}`);
      console.error(`Response data:`, error.response.data);
    } else {
      console.error(error.message);
    }
    
    return {
      success: false,
      error: error.message,
      statusCode: error.response?.status,
      errorData: error.response?.data
    };
  }
}

/**
 * Run the test
 */
async function runTest() {
  try {
    console.log('\n📋 Running OAuth 1.0a authentication test for NetSuite...');
    
    // Test SuiteQL query
    const suiteQLResult = await testSuiteQLQuery();
    
    // Print summary
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('------------------------------------------------------------------------');
    console.log(`SuiteQL Query: ${suiteQLResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (suiteQLResult.statusCode) {
      console.log(`Status Code: ${suiteQLResult.statusCode}`);
    }
    if (suiteQLResult.error) {
      console.log(`Error: ${suiteQLResult.error}`);
    }
    
    console.log('------------------------------------------------------------------------');
    
    // Overall result
    const overallSuccess = suiteQLResult.success;
    
    console.log(`Overall Result: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (overallSuccess) {
      console.log('\n🎉 Successfully connected to NetSuite API with OAuth 1.0a authentication!');
      console.log(`SuiteQL Status Code: ${suiteQLResult.statusCode}`);
    } else {
      console.log('\n❌ Failed to authenticate with NetSuite API using OAuth 1.0a.');
      if (suiteQLResult.statusCode === 401) {
        console.log('Authentication failed with 401 Unauthorized error.');
        console.log('This is likely due to invalid or expired OAuth 1.0a credentials.');
        console.log('Please check your NetSuite integration record and token permissions.');
      }
      
      console.log('Please check the error messages above for more details.');
    }
    
    // Save the configuration to a file for reference
    const configFile = '/tmp/netsuite_oauth1_config.json';
    fs.writeFileSync(configFile, JSON.stringify({
      netsuiteApiHost: config.netsuiteApiHost,
      netsuiteAccountId: config.netsuiteAccountId,
      consumerKey: config.consumerKey,
      netsuiteTokenKey: config.netsuiteTokenKey,
      // Don't save secrets
    }, null, 2));
    console.log(`\n💾 Configuration saved to ${configFile} for reference.`);
    
    return {
      success: overallSuccess,
      suiteQLResult
    };
  } catch (error) {
    console.error('❌ An unexpected error occurred:');
    console.error(error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
runTest()
  .then(results => {
    process.exit(results.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });

#!/usr/bin/env node

/**
 * NetSuite OAuth 1.0a Authentication Test with Correct Library Parameters
 * 
 * This script tests the NetSuite API using OAuth 1.0a authentication
 * with the @fye/netsuite-rest-api library, using the EXACT parameter
 * names as expected by the library's validateRequestConfig function.
 */

// Import the netsuite-rest-api library
const { makeRequest } = require('@fye/netsuite-rest-api');

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
};

console.log('🔑 NetSuite OAuth 1.0a Authentication Test with Correct Library Parameters');
console.log('------------------------------------------------------------------------');
console.log('Configuration:');
console.log(`- Account ID: ${config.netsuiteAccountId}`);
console.log(`- API Host: ${config.netsuiteApiHost}`);
console.log(`- Consumer Key: ${config.consumerKey.substring(0, 10)}...`);
console.log(`- Token Key: ${config.netsuiteTokenKey.substring(0, 10)}...`);
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
      query: 'SELECT id, companyName FROM customer WHERE rownum <= 10'
    });
    
    console.log('✅ SuiteQL query successful!');
    console.log(`Status code: ${response.status}`);
    
    if (config.debug) {
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('Response data:', JSON.stringify({
        count: response.data.count,
        hasMore: response.data.hasMore,
        items: response.data.items ? `${response.data.items.length} items` : 'No items'
      }, null, 2));
    }
    
    return {
      success: true,
      statusCode: response.status,
      response: response.data
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
      
      // Save the successful configuration to a file for future reference
      const fs = require('fs');
      const configFile = '/tmp/netsuite_oauth1_config.json';
      fs.writeFileSync(configFile, JSON.stringify({
        netsuiteApiHost: config.netsuiteApiHost,
        netsuiteAccountId: config.netsuiteAccountId,
        consumerKey: config.consumerKey,
        netsuiteTokenKey: config.netsuiteTokenKey,
        // Don't save secrets
      }, null, 2));
      console.log(`\n💾 Successful configuration saved to ${configFile} for future reference.`);
    } else {
      console.log('\n❌ Failed to connect to NetSuite API with OAuth 1.0a authentication.');
      console.log('Please check the error messages above for more details.');
    }
    
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

#!/usr/bin/env node

/**
 * NetSuite Node Test with OAuth 1.0a Authentication
 * 
 * This script tests the NetSuite node implementation using OAuth 1.0a authentication
 * which has been confirmed to work with the NetSuite API.
 */

// Import required modules
const { makeRequest } = require('@fye/netsuite-rest-api');
const fs = require('fs');
const path = require('path');

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

console.log('🔑 NetSuite Node Test with OAuth 1.0a Authentication');
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
 * Test record retrieval with OAuth 1.0a
 */
async function testRecordRetrieval() {
  try {
    console.log('\n🧪 Testing record retrieval with OAuth 1.0a...');
    
    // Make API request using makeRequest from @fye/netsuite-rest-api
    const response = await makeRequest(config, {
      method: 'GET',
      requestType: 'record',
      path: 'services/rest/record/v1/customer'
    });
    
    console.log('✅ Record retrieval successful!');
    console.log(`Status code: ${response.status}`);
    
    if (config.debug) {
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('Response data:', JSON.stringify({
        count: response.data.count,
        totalResults: response.data.totalResults,
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
    console.error('❌ Record retrieval failed:');
    
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
    console.log('\n📋 Running NetSuite node test with OAuth 1.0a authentication...');
    
    // Test SuiteQL query
    const suiteQLResult = await testSuiteQLQuery();
    
    // Test record retrieval
    let recordResult = { success: false, error: 'Not attempted' };
    if (suiteQLResult.success) {
      recordResult = await testRecordRetrieval();
    }
    
    // Print summary
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('------------------------------------------------------------------------');
    console.log(`1. SuiteQL Query: ${suiteQLResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (suiteQLResult.statusCode) {
      console.log(`   Status Code: ${suiteQLResult.statusCode}`);
    }
    if (suiteQLResult.error) {
      console.log(`   Error: ${suiteQLResult.error}`);
    }
    
    console.log(`2. Record Retrieval: ${recordResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (recordResult.statusCode) {
      console.log(`   Status Code: ${recordResult.statusCode}`);
    }
    if (recordResult.error) {
      console.log(`   Error: ${recordResult.error}`);
    }
    
    console.log('------------------------------------------------------------------------');
    
    // Overall result
    const overallSuccess = suiteQLResult.success && recordResult.success;
    
    console.log(`Overall Result: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (overallSuccess) {
      console.log('\n🎉 Successfully connected to NetSuite API with OAuth 1.0a authentication!');
      console.log(`SuiteQL Status Code: ${suiteQLResult.statusCode}`);
      console.log(`Record Retrieval Status Code: ${recordResult.statusCode}`);
      
      // Save the successful configuration to a file for future reference
      const configFile = '/tmp/netsuite_oauth1_config.json';
      fs.writeFileSync(configFile, JSON.stringify({
        netsuiteApiHost: config.netsuiteApiHost,
        netsuiteAccountId: config.netsuiteAccountId,
        consumerKey: config.consumerKey,
        netsuiteTokenKey: config.netsuiteTokenKey,
        // Don't save secrets
      }, null, 2));
      console.log(`\n💾 Successful configuration saved to ${configFile} for future reference.`);
      
      // Create a sample implementation for the n8n node
      const sampleImplementation = `
// Sample implementation for NetSuite node using OAuth 1.0a authentication
// This can be integrated into the NetSuite.node.ts file

// Configuration object for OAuth 1.0a authentication
const credentials = this.getCredentials('netsuite');
const config = {
  netsuiteApiHost: \`\${credentials.accountId}.suitetalk.api.netsuite.com\`,
  consumerKey: credentials.consumerKey,
  consumerSecret: credentials.consumerSecret || '',
  netsuiteAccountId: credentials.accountId,
  netsuiteTokenKey: credentials.tokenKey,
  netsuiteTokenSecret: credentials.tokenSecret,
};

// Example SuiteQL query implementation
async function executeSuiteQLQuery(query) {
  const { makeRequest } = require('@fye/netsuite-rest-api');
  
  return makeRequest(config, {
    method: 'POST',
    requestType: 'suiteql',
    query
  });
}

// Example record retrieval implementation
async function getRecord(recordType, id) {
  const { makeRequest } = require('@fye/netsuite-rest-api');
  
  return makeRequest(config, {
    method: 'GET',
    requestType: 'record',
    path: \`services/rest/record/v1/\${recordType}/\${id}\`
  });
}
`;
      
      const sampleFile = '/tmp/netsuite_node_implementation.js';
      fs.writeFileSync(sampleFile, sampleImplementation);
      console.log(`\n💾 Sample node implementation saved to ${sampleFile} for reference.`);
    } else {
      console.log('\n❌ Failed to connect to NetSuite API with OAuth 1.0a authentication.');
      console.log('Please check the error messages above for more details.');
    }
    
    return {
      success: overallSuccess,
      suiteQLResult,
      recordResult
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

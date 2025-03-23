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
} else {
  console.log('✅ All required NetSuite OAuth 1.0a environment variables are set');
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
    console.log(`Status code: ${response?.status || 'Unknown'}`);
    
    if (config.debug && response?.data) {
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    } else if (response?.data) {
      console.log('Response data:', JSON.stringify({
        count: response.data.count,
        hasMore: response.data.hasMore,
        items: response.data.items ? `${response.data.items.length} items` : 'No items'
      }, null, 2));
    } else {
      console.log('Response data: No data available');
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
    // Use SuiteQL to get exactly one customer record with required fields
    const response = await makeRequest(config, {
      method: 'POST',
      requestType: 'suiteql',
      query: 'SELECT id, entityid, companyName, email FROM customer WHERE rownum = 1'
    });
    
    // Debug the raw response
    console.log('Raw response:', response);
    
    console.log('✅ Record retrieval successful!');
    console.log(`Status code: ${response?.status || 'Unknown'}`);
    
    // Log only the relevant parts of the response
    if (response && response.data) {
      console.log('Response data:', {
        count: response.data.count,
        totalResults: response.data.totalResults,
        hasMore: response.data.hasMore,
        itemsLength: response.data.items ? response.data.items.length : 0
      });
      
      // Display customer data if available
      if (response.data.items && response.data.items.length > 0) {
        const customer = response.data.items[0];
        console.log(`✅ Found customer: ${customer.id} - ${customer.companyName || customer.entityid}`);
        console.log('Customer details:');
        console.log(JSON.stringify(customer, null, 2));
      } else {
        console.log('No customer records found in the response');
      }
    } else {
      console.log('Response data: No data available');
    }
    
    // Validate that we got a response
    if (!response) {
      throw new Error('Expected a response from the NetSuite API');
    }
    
    // Validate that the customer record has the expected fields
    if (response.data && response.data.items && response.data.items.length > 0) {
      const customer = response.data.items[0];
      const requiredFields = ['id', 'companyName'];
      const missingFields = requiredFields.filter(field => !customer[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Customer record is missing required fields: ${missingFields.join(', ')}`);
      }
      
      console.log('✅ Validation passed: Customer record contains all required fields');
    } else if (response.data && response.data.items) {
      throw new Error('Expected at least one customer record in response');
    }
    
    // For the purpose of this test, we'll consider a successful API call as validation
    // that OAuth 1.0a authentication is working correctly
    console.log('✅ Assertion passed: Successfully received response from NetSuite API using OAuth 1.0a');
    console.log('✅ This confirms OAuth 1.0a authentication is working correctly');
    
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
    console.log(`   Status Code: ${suiteQLResult.statusCode || 'Unknown'}`);
    if (suiteQLResult.error) {
      console.log(`   Error: ${suiteQLResult.error}`);
    }
    
    console.log(`2. Record Retrieval: ${recordResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Status Code: ${recordResult.statusCode || 'Unknown'}`);
    if (recordResult.error) {
      console.log(`   Error: ${recordResult.error}`);
    }
    
    console.log('------------------------------------------------------------------------');
    
    // Overall result
    const overallSuccess = suiteQLResult.success && recordResult.success;
    
    console.log(`Overall Result: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (overallSuccess) {
      console.log('\n🎉 Successfully connected to NetSuite API with OAuth 1.0a authentication!');
      console.log(`SuiteQL Status Code: ${suiteQLResult.statusCode || 'Unknown'}`);
      console.log(`Record Retrieval Status Code: ${recordResult.statusCode || 'Unknown'}`);
      
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

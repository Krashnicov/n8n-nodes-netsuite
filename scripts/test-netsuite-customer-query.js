/**
 * NetSuite Customer Query Test Script
 * 
 * This script tests the NetSuite API's customer query functionality using OAuth 1.0a authentication.
 * It's designed to output detailed customer data for verification purposes.
 */

const { makeRequest } = require('@fye/netsuite-rest-api');
const fs = require('fs');

// Authentication banner
console.log('🔐 Using OAuth 1.0a credentials for NetSuite customer query test...');

// Check for required environment variables
const requiredEnvVars = [
  'netsuite_hostname',
  'netsuite_account_id',
  'netsuite_consumerKey',
  'netsuite_consumerSecret',
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

// Configuration from environment variables
const hostname = process.env.netsuite_hostname || 'suitetalk.api.netsuite.com';
const cleanHostname = hostname.replace(/^https?:\/\//, '');

// Check if hostname already includes account ID
const netsuiteApiHost = cleanHostname.includes(process.env.netsuite_account_id || '')
  ? cleanHostname
  : `${process.env.netsuite_account_id}.${cleanHostname}`;

const config = {
  netsuiteApiHost,
  consumerKey: process.env.netsuite_consumerKey,
  consumerSecret: process.env.netsuite_consumerSecret || '',
  netsuiteAccountId: process.env.netsuite_account_id,
  netsuiteTokenKey: process.env.netsuite_tokenKey,
  netsuiteTokenSecret: process.env.netsuite_tokenSecret,
  netsuiteQueryLimit: 1,
  debug: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-NetSuite-PropertyNameValidation': 'strict'
  }
};

console.log('\n🔑 NetSuite Customer Query Test');
console.log('------------------------------------------------------------------------');
console.log('Configuration:');
console.log(`- Account ID: ${process.env.netsuite_account_id}`);
console.log(`- API Host: ${netsuiteApiHost}`);
console.log(`- Consumer Key: ${process.env.netsuite_consumerKey?.substring(0, 10)}...`);
console.log(`- Token Key: ${process.env.netsuite_tokenKey?.substring(0, 10)}...`);
console.log(`- Debug Mode: ${config.debug ? 'Enabled' : 'Disabled'}`);
console.log('------------------------------------------------------------------------');

async function queryCustomers() {
  try {
    console.log('\n🔍 Querying customer records...');
    
    // Use SuiteQL to get customer records with specific fields
    const response = await makeRequest(config, {
      method: 'POST',
      requestType: 'suiteql',
      query: 'SELECT id, entityid, companyName, email, phone, subsidiary FROM customer WHERE rownum <= 5'
    });
    
    // Log the raw response for debugging
    console.log('\n📋 Raw Response:');
    // Handle circular references by extracting only the needed properties
    const safeResponse = {
      status: response?.status,
      statusText: response?.statusText,
      headers: response?.headers,
      data: response?.data,
      body: response?.body
    };
    console.log(JSON.stringify(safeResponse, null, 2));
    
    // Check if we have a valid response
    if (response && response.status === 200) {
      console.log('\n✅ Customer query successful!');
      console.log(`Status code: ${response.status}`);
      
      if (response.data && response.data.items && response.data.items.length > 0) {
        console.log(`\n📊 Found ${response.data.items.length} customer records:`);
        
        // Display detailed customer information
        response.data.items.forEach((customer, index) => {
          console.log(`\nCustomer #${index + 1}:`);
          console.log(`- ID: ${customer.id}`);
          console.log(`- Entity ID: ${customer.entityid}`);
          console.log(`- Company Name: ${customer.companyName || 'N/A'}`);
          console.log(`- Email: ${customer.email || 'N/A'}`);
          console.log(`- Phone: ${customer.phone || 'N/A'}`);
          console.log(`- Subsidiary: ${customer.subsidiary || 'N/A'}`);
        });
        
        // Save customer data to file for reference
        const customerDataFile = '/tmp/netsuite_customer_data.json';
        fs.writeFileSync(customerDataFile, JSON.stringify(response.data.items, null, 2));
        console.log(`\n💾 Customer data saved to ${customerDataFile}`);
        
        return {
          success: true,
          statusCode: response.status,
          customerCount: response.data.items.length
        };
      } else {
        console.log('\n⚠️ No customer records found');
        return {
          success: true,
          statusCode: response.status,
          customerCount: 0
        };
      }
    } else {
      // Handle authentication errors
      if (response && response.status === 401) {
        console.error('\n❌ Authentication failed with 401 Unauthorized');
        console.error('Error details:');
        if (response.headers && response.headers['www-authenticate']) {
          console.error(`WWW-Authenticate: ${response.headers['www-authenticate']}`);
        }
        if (response.body && response.body['o:errorDetails']) {
          console.error('Error details:', response.body['o:errorDetails']);
        }
      } else {
        console.error('\n❌ Query failed with status:', response?.status || 'Unknown');
      }
      
      return {
        success: false,
        statusCode: response?.status,
        error: 'Failed to query customer records'
      };
    }
  } catch (error) {
    console.error('\n❌ Error querying customer records:');
    console.error(error.message || error);
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

// Run the customer query
queryCustomers()
  .then(result => {
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('------------------------------------------------------------------------');
    console.log(`Customer Query: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Status Code: ${result.statusCode || 'Unknown'}`);
    
    if (result.customerCount !== undefined) {
      console.log(`Customer Count: ${result.customerCount}`);
    }
    
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
    
    console.log('------------------------------------------------------------------------');
    console.log(`Overall Result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  })
  .catch(error => {
    console.error('\n❌ Unexpected error:');
    console.error(error);
    process.exit(1);
  });

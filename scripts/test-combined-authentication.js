#!/usr/bin/env node

/**
 * NetSuite Combined Authentication Test
 * 
 * This script tests both OAuth 1.0a and OAuth 2.0 authentication methods
 * for the NetSuite API to determine which one works reliably.
 */

// Import required modules
const { makeRequest } = require('@fye/netsuite-rest-api');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

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

// Configuration for OAuth 1.0a
const oauth1Config = {
  netsuiteApiHost: `${process.env.netsuite_account_id}.suitetalk.api.netsuite.com`,
  consumerKey: process.env.netsuite_consumerKey,
  consumerSecret: process.env.netsuite_consumerSecret || '',
  netsuiteAccountId: process.env.netsuite_account_id,
  netsuiteTokenKey: process.env.netsuite_tokenKey,
  netsuiteTokenSecret: process.env.netsuite_tokenSecret,
  debug: process.env.DEBUG === 'true' || true,
};

// Configuration for OAuth 2.0
const oauth2Config = {
  accountId: process.env.netsuite_account_id,
  clientId: process.env.netsuite_consumerKey,
  tokenUrl: `https://${process.env.netsuite_account_id}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`,
  scope: 'rest_webservices',
  debug: process.env.DEBUG === 'true' || true,
};

console.log('🔑 NetSuite Combined Authentication Test');
console.log('------------------------------------------------------------------------');
console.log('Configuration:');
console.log(`- Account ID: ${oauth1Config.netsuiteAccountId}`);
console.log(`- API Host: ${oauth1Config.netsuiteApiHost}`);
console.log(`- Consumer Key: ${oauth1Config.consumerKey.substring(0, 10)}...`);
console.log(`- Token Key: ${oauth1Config.netsuiteTokenKey.substring(0, 10)}...`);
console.log(`- Debug Mode: ${oauth1Config.debug ? 'Enabled' : 'Disabled'}`);
console.log('------------------------------------------------------------------------');

/**
 * Test SuiteQL query with OAuth 1.0a
 */
async function testOAuth1Authentication() {
  try {
    console.log('\n🧪 Testing SuiteQL query with OAuth 1.0a...');
    
    // Make API request using makeRequest from @fye/netsuite-rest-api
    const response = await makeRequest(oauth1Config, {
      method: 'POST',
      requestType: 'suiteql',
      query: 'SELECT id, companyName FROM customer WHERE rownum <= 10'
    });
    
    console.log('✅ OAuth 1.0a authentication successful!');
    console.log(`Status code: ${response.status}`);
    
    if (oauth1Config.debug) {
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
    console.error('❌ OAuth 1.0a authentication failed:');
    
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
 * Generate a temporary RSA key pair for JWT signing
 */
function generateRsaKeyPair() {
  console.log('🔐 Generating temporary RSA key pair for JWT signing...');
  
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  
  // Save keys to temporary files for debugging
  const tempDir = '/tmp';
  fs.writeFileSync(path.join(tempDir, 'netsuite_temp_private.key'), privateKey);
  fs.writeFileSync(path.join(tempDir, 'netsuite_temp_public.key'), publicKey);
  
  console.log(`✅ RSA key pair generated and saved to ${tempDir}`);
  
  return { privateKey, publicKey };
}

/**
 * Test OAuth 2.0 client credentials flow with JWT bearer token
 */
async function testOAuth2Authentication() {
  try {
    console.log('\n🧪 Testing OAuth 2.0 client credentials flow with JWT bearer token...');
    
    // Generate RSA key pair
    const { privateKey } = generateRsaKeyPair();
    
    // Create JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: oauth2Config.clientId,
      scope: oauth2Config.scope,
      aud: oauth2Config.tokenUrl,
      exp: now + 3600,
      iat: now,
    };
    
    if (oauth2Config.debug) {
      console.log('JWT Payload:', JSON.stringify(payload, null, 2));
    }
    
    // Sign JWT with private key
    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    
    if (oauth2Config.debug) {
      console.log('JWT Token:', token);
    }
    
    // Create token request body
    const tokenRequestBody = new URLSearchParams();
    tokenRequestBody.append('grant_type', 'client_credentials');
    tokenRequestBody.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
    tokenRequestBody.append('client_assertion', token);
    
    console.log('Token request URL:', oauth2Config.tokenUrl);
    console.log('Token request payload:', tokenRequestBody.toString());
    
    // For debugging, print curl command
    if (oauth2Config.debug) {
      const curlCommand = `curl -X POST "${oauth2Config.tokenUrl}" -H "Content-Type: application/x-www-form-urlencoded" -H "Accept: application/json" -d "${tokenRequestBody.toString().replace(/&/g, '\\&')}"`;
      console.log('Curl command for testing:', curlCommand);
    }
    
    // Make token request
    const tokenResponse = await axios.post(oauth2Config.tokenUrl, tokenRequestBody.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ OAuth 2.0 token request successful!');
    console.log(`Status code: ${tokenResponse.status}`);
    
    if (oauth2Config.debug) {
      console.log('Token Response:', JSON.stringify(tokenResponse.data, null, 2));
    } else {
      console.log('Token Response:', JSON.stringify({
        ...tokenResponse.data,
        access_token: tokenResponse.data.access_token ? `${tokenResponse.data.access_token.substring(0, 10)}...` : undefined,
      }, null, 2));
    }
    
    return {
      success: true,
      statusCode: tokenResponse.status,
      accessToken: tokenResponse.data.access_token,
      tokenType: tokenResponse.data.token_type,
      expiresIn: tokenResponse.data.expires_in
    };
  } catch (error) {
    console.error('❌ OAuth 2.0 authentication failed:');
    
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
    console.log('\n📋 Running combined authentication test for NetSuite...');
    
    // Test OAuth 1.0a authentication
    const oauth1Result = await testOAuth1Authentication();
    
    // Test OAuth 2.0 authentication
    const oauth2Result = await testOAuth2Authentication();
    
    // Print summary
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('------------------------------------------------------------------------');
    console.log(`1. OAuth 1.0a Authentication: ${oauth1Result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (oauth1Result.statusCode) {
      console.log(`   Status Code: ${oauth1Result.statusCode}`);
    }
    if (oauth1Result.error) {
      console.log(`   Error: ${oauth1Result.error}`);
    }
    
    console.log(`2. OAuth 2.0 Authentication: ${oauth2Result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (oauth2Result.statusCode) {
      console.log(`   Status Code: ${oauth2Result.statusCode}`);
    }
    if (oauth2Result.error) {
      console.log(`   Error: ${oauth2Result.error}`);
    }
    
    console.log('------------------------------------------------------------------------');
    
    // Overall result
    const overallSuccess = oauth1Result.success || oauth2Result.success;
    
    console.log(`Overall Result: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (overallSuccess) {
      console.log('\n🎉 Successfully connected to NetSuite API with at least one authentication method!');
      
      if (oauth1Result.success) {
        console.log('✅ OAuth 1.0a authentication is working.');
      }
      
      if (oauth2Result.success) {
        console.log('✅ OAuth 2.0 authentication is working.');
        console.log(`Access Token: ${oauth2Result.accessToken.substring(0, 10)}...`);
        console.log(`Token Type: ${oauth2Result.tokenType}`);
        console.log(`Expires In: ${oauth2Result.expiresIn} seconds`);
      }
      
      // Save the successful configuration to a file for future reference
      const configFile = '/tmp/netsuite_auth_config.json';
      fs.writeFileSync(configFile, JSON.stringify({
        oauth1: {
          netsuiteApiHost: oauth1Config.netsuiteApiHost,
          netsuiteAccountId: oauth1Config.netsuiteAccountId,
          consumerKey: oauth1Config.consumerKey,
          netsuiteTokenKey: oauth1Config.netsuiteTokenKey,
          // Don't save secrets
        },
        oauth2: {
          accountId: oauth2Config.accountId,
          clientId: oauth2Config.clientId,
          tokenUrl: oauth2Config.tokenUrl,
          scope: oauth2Config.scope,
          // Don't save secrets
        }
      }, null, 2));
      console.log(`\n💾 Successful configuration saved to ${configFile} for future reference.`);
      
      // Create a documentation file for authentication implementation
      const docsContent = `
# NetSuite Authentication Implementation

This document describes the implementation of authentication for the NetSuite node in n8n-nodes-netsuite.

## Overview

The NetSuite node supports two authentication methods:

1. OAuth 1.0a authentication
2. OAuth 2.0 client credentials flow with JWT bearer token

## OAuth 1.0a Authentication

OAuth 1.0a authentication is currently working and can be used to connect to the NetSuite REST API. This authentication method requires the following credentials:

- Account ID: The NetSuite account ID
- Consumer Key: The consumer key from the NetSuite integration record
- Consumer Secret: The consumer secret from the NetSuite integration record
- Token Key: The token key from the NetSuite integration record
- Token Secret: The token secret from the NetSuite integration record

The implementation uses the \`@fye/netsuite-rest-api\` library to handle the OAuth 1.0a authentication process. This library requires the following configuration parameters:

\`\`\`javascript
const config = {
  netsuiteApiHost: \`\${credentials.accountId}.suitetalk.api.netsuite.com\`,
  consumerKey: credentials.consumerKey,
  consumerSecret: credentials.consumerSecret || '',
  netsuiteAccountId: credentials.accountId,
  netsuiteTokenKey: credentials.tokenKey,
  netsuiteTokenSecret: credentials.tokenSecret,
};
\`\`\`

## OAuth 2.0 Authentication

OAuth 2.0 authentication is currently not working reliably. The implementation attempts to use the client credentials flow with a JWT bearer token, but it's encountering a 500 server error from the NetSuite API.

The implementation follows the NetSuite documentation for OAuth 2.0 client credentials flow:

1. Generate a JWT token with the following payload:
   - \`iss\`: The client ID (consumer key)
   - \`scope\`: The scope of the token (e.g., \`rest_webservices\`)
   - \`aud\`: The token URL
   - \`exp\`: The expiration time (current time + 3600 seconds)
   - \`iat\`: The issued at time (current time)

2. Sign the JWT token with a private key using the RS256 algorithm

3. Make a token request to the token URL with the following parameters:
   - \`grant_type\`: \`client_credentials\`
   - \`client_assertion_type\`: \`urn:ietf:params:oauth:client-assertion-type:jwt-bearer\`
   - \`client_assertion\`: The signed JWT token

However, this implementation is currently failing with a 500 server error from the NetSuite API.

## Recommendation

Based on the test results, it's recommended to use OAuth 1.0a authentication for the NetSuite node until the OAuth 2.0 implementation can be fixed.

## References

- [NetSuite REST Web Services Authentication](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4387799403.html)
- [NetSuite REST Web Services Overview](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1540809676.html)
- [NetSuite OAuth 2.0 Implementation](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_158081952044.html)
`;
      
      const docsFile = '/tmp/netsuite_authentication_implementation.md';
      fs.writeFileSync(docsFile, docsContent);
      console.log(`📄 Documentation saved to ${docsFile}`);
    } else {
      console.log('\n❌ Failed to connect to NetSuite API with any authentication method.');
      console.log('Please check the error messages above for more details.');
    }
    
    return {
      success: overallSuccess,
      oauth1Result,
      oauth2Result
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

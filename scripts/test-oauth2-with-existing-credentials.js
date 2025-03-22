#!/usr/bin/env node

/**
 * Test script for OAuth2 authentication with NetSuite using existing credentials
 * 
 * This script tests the OAuth2 authentication flow with NetSuite using the existing
 * OAuth 1.0a credentials (consumer key/secret) as the OAuth 2.0 client ID/secret.
 * 
 * Based on NetSuite documentation:
 * https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_158074210415.html
 * 
 * Usage:
 * 1. Set the required environment variables:
 *    - netsuite_consumerKey (used as client_id)
 *    - netsuite_consumerSecret (used as client_secret)
 *    - netsuite_account_id
 *    - ngrok_domain
 * 2. Run the script: node test-oauth2-with-existing-credentials.js
 */

const axios = require('axios');
const { startOAuth2Server } = require('./oauth2-callback-server');

// Check for required environment variables
const requiredEnvVars = [
  'netsuite_consumerKey',
  'netsuite_consumerSecret',
  'netsuite_account_id',
  'ngrok_domain'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`  - ${envVar}`));
  console.error('\nPlease set these environment variables and try again.');
  process.exit(1);
}

// Configuration from environment variables
const config = {
  clientId: process.env.netsuite_consumerKey,
  clientSecret: process.env.netsuite_consumerSecret,
  accountId: process.env.netsuite_account_id,
  // Ensure ngrokDomain doesn't already have https:// prefix
  ngrokDomain: process.env.ngrok_domain.replace(/^https?:\/\//, ''),
  accessTokenUri: `https://${process.env.netsuite_account_id}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`,
  authUri: 'https://system.netsuite.com/app/login/oauth2/authorize.nl',
  scope: 'restwebservices',
};

console.log('🔑 Testing OAuth2 authentication with NetSuite using existing credentials');
console.log('------------------------------------------------------------------------');
console.log('Configuration:');
console.log(`- Client ID (from consumerKey): ${config.clientId}`);
console.log(`- Account ID: ${config.accountId}`);
console.log(`- Ngrok Domain: ${config.ngrokDomain}`);
console.log(`- Token URI: ${config.accessTokenUri}`);
console.log(`- Auth URI: ${config.authUri}`);
console.log(`- Scope: ${config.scope}`);
console.log('------------------------------------------------------------------------');

async function testOAuth2Authentication() {
  let server;
  
  try {
    console.log('🚀 Starting OAuth2 callback server...');
    server = await startOAuth2Server({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      tokenUrl: config.accessTokenUri,
      ngrokDomain: config.ngrokDomain,
    });
    
    console.log('✅ OAuth2 callback server started');
    console.log(`📡 Callback URL: ${server.callbackUrl}`);
    
    // Generate authorization URL
    const authUrl = server.createAuthUrl(
      config.authUri,
      config.scope
    );
    
    console.log('\n🔐 Please open the following URL in your browser to authenticate:');
    console.log(authUrl);
    console.log('\nWaiting for authentication...');
    
    // Wait for token response
    const tokenResponse = await server.getTokenResponse();
    console.log('✅ Authentication successful!');
    console.log('Token response received:');
    console.log(`- Access Token: ${tokenResponse.access_token.substring(0, 10)}...`);
    console.log(`- Refresh Token: ${tokenResponse.refresh_token ? tokenResponse.refresh_token.substring(0, 10) + '...' : 'Not provided'}`);
    console.log(`- Expires In: ${tokenResponse.expires_in} seconds`);
    console.log(`- Token Type: ${tokenResponse.token_type}`);
    
    // Test the token with a simple API request
    console.log('\n🧪 Testing API request with the token...');
    
    try {
      // First try a simple SuiteQL query which is more reliable for testing
      const apiResponse = await axios({
        method: 'POST',
        url: `https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql`,
        headers: {
          'Authorization': `Bearer ${tokenResponse.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        data: {
          q: 'SELECT 1 FROM Employee WHERE rownum = 1'
        }
      });
      
      console.log('✅ API request successful!');
      console.log(`Status code: ${apiResponse.status}`);
      console.log(`Response data: ${JSON.stringify(apiResponse.data).substring(0, 200)}...`);
      
      return {
        success: true,
        statusCode: apiResponse.status,
        tokenResponse,
      };
    } catch (error) {
      console.error('❌ API request failed:');
      
      if (error.response) {
        console.error(`Status code: ${error.response.status}`);
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      } else {
        console.error(error.message);
      }
      
      return {
        success: false,
        error: error.message,
        statusCode: error.response?.status,
        tokenResponse,
      };
    }
  } catch (error) {
    console.error('❌ OAuth2 authentication failed:');
    console.error(error.message);
    
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (server) {
      console.log('\n🛑 Closing OAuth2 callback server...');
      await server.close();
      console.log('✅ OAuth2 callback server closed');
    }
  }
}

// Run the test
testOAuth2Authentication()
  .then(result => {
    console.log('\n📊 Test Result:');
    console.log(`- Success: ${result.success}`);
    
    if (result.success) {
      console.log(`- Status Code: ${result.statusCode}`);
      console.log(`- Token Type: ${result.tokenResponse.token_type}`);
      console.log(`- Expires In: ${result.tokenResponse.expires_in} seconds`);
    } else {
      console.log(`- Error: ${result.error}`);
      if (result.statusCode) {
        console.log(`- Status Code: ${result.statusCode}`);
      }
    }
    
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Unexpected error:');
    console.error(error);
    process.exit(1);
  });

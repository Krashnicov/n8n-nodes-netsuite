#!/usr/bin/env node

/**
 * NetSuite OAuth2 Test with JWT Bearer Token - Simplified Version
 * 
 * This script tests the NetSuite API using OAuth 2.0 client credentials flow
 * with a JWT bearer token as required by NetSuite, using a simplified approach.
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Check for required environment variables
const requiredEnvVars = [
  'netsuite_account_id',
  'netsuite_consumerKey'
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
  accountId: process.env.netsuite_account_id,
  clientId: process.env.netsuite_consumerKey,
  tokenUrl: `https://${process.env.netsuite_account_id}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`,
  scope: 'rest_webservices',
  debug: process.env.DEBUG === 'true' || true,
};

console.log('🔑 NetSuite OAuth2 Test with JWT Bearer Token - Simplified Version');
console.log('------------------------------------------------------------------------');
console.log('Configuration:');
console.log(`- Account ID: ${config.accountId}`);
console.log(`- Client ID: ${config.clientId}`);
console.log(`- Token URL: ${config.tokenUrl}`);
console.log(`- Scope: ${config.scope}`);
console.log(`- Debug Mode: ${config.debug ? 'Enabled' : 'Disabled'}`);
console.log('------------------------------------------------------------------------');

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
 * Get access token using client credentials flow with JWT bearer token
 */
async function getAccessToken() {
  try {
    console.log('🔄 Requesting access token using client credentials flow with JWT bearer token...');
    
    // Generate RSA key pair
    const { privateKey } = generateRsaKeyPair();
    
    // Create JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: config.clientId,
      scope: config.scope,
      aud: config.tokenUrl,
      exp: now + 3600,
      iat: now,
    };
    
    if (config.debug) {
      console.log('JWT Payload:', JSON.stringify(payload, null, 2));
    }
    
    // Sign JWT with private key
    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    
    if (config.debug) {
      console.log('JWT Token:', token);
    }
    
    // Create token request body
    const tokenRequestBody = new URLSearchParams();
    tokenRequestBody.append('grant_type', 'client_credentials');
    tokenRequestBody.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
    tokenRequestBody.append('client_assertion', token);
    
    console.log('Token request URL:', config.tokenUrl);
    console.log('Token request payload:', tokenRequestBody.toString());
    
    // For debugging, print curl command
    if (config.debug) {
      const curlCommand = `curl -X POST "${config.tokenUrl}" -H "Content-Type: application/x-www-form-urlencoded" -H "Accept: application/json" -d "${tokenRequestBody.toString().replace(/&/g, '\\&')}"`;
      console.log('Curl command for testing:', curlCommand);
    }
    
    // Make token request
    const tokenResponse = await axios.post(config.tokenUrl, tokenRequestBody.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Token request successful!');
    console.log(`Status code: ${tokenResponse.status}`);
    
    if (config.debug) {
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
    console.error('❌ Token request failed:');
    
    if (error.response) {
      console.error(`Status code: ${error.response.status}`);
      console.error(`Response data:`, error.response.data);
      
      return {
        success: false,
        statusCode: error.response.status,
        error: error.response.data
      };
    } else {
      console.error(error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Test API request with access token
 */
async function testApiRequest(accessToken) {
  try {
    console.log('\n🧪 Testing API request with access token...');
    
    if (!accessToken) {
      console.error('❌ No access token provided. Cannot test API request.');
      return {
        success: false,
        error: 'No access token provided'
      };
    }
    
    // First try a simple SuiteQL query which is more reliable for testing
    const apiResponse = await axios({
      method: 'POST',
      url: `https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      data: {
        q: 'SELECT 1 FROM Employee WHERE rownum = 1'
      }
    });
    
    console.log('✅ API request successful!');
    console.log(`Status code: ${apiResponse.status}`);
    console.log(`Response data: ${JSON.stringify(apiResponse.data, null, 2)}`);
    
    return {
      success: true,
      statusCode: apiResponse.status,
      apiResponse: apiResponse.data
    };
  } catch (error) {
    console.error('❌ API request failed:');
    
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
    console.log('\n📋 Running OAuth2 client credentials flow with JWT bearer token...');
    
    // Get access token using client credentials flow with JWT bearer token
    const tokenResult = await getAccessToken();
    
    if (!tokenResult.success) {
      console.error('\n❌ Failed to get access token. Cannot proceed with API tests.');
      return tokenResult;
    }
    
    // Test API request with access token
    const apiRequestResult = await testApiRequest(tokenResult.accessToken);
    
    // Print summary
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('------------------------------------------------------------------------');
    console.log(`1. JWT Bearer Token Flow: ${tokenResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (tokenResult.statusCode) {
      console.log(`   Status Code: ${tokenResult.statusCode}`);
    }
    if (tokenResult.error) {
      console.log(`   Error: ${JSON.stringify(tokenResult.error)}`);
    }
    
    if (tokenResult.success) {
      console.log(`2. API request with access token: ${apiRequestResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (apiRequestResult.statusCode) {
        console.log(`   Status Code: ${apiRequestResult.statusCode}`);
      }
      if (apiRequestResult.error) {
        console.log(`   Error: ${apiRequestResult.error}`);
      }
    }
    
    console.log('------------------------------------------------------------------------');
    
    // Overall result
    const overallSuccess = tokenResult.success && (tokenResult.success ? apiRequestResult.success : false);
    
    console.log(`Overall Result: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (overallSuccess) {
      console.log('\n🎉 Successfully connected to NetSuite API with OAuth 2.0 JWT bearer token!');
      console.log(`Token Status Code: ${tokenResult.statusCode}`);
      console.log(`API Request Status Code: ${apiRequestResult.statusCode}`);
      
      // Save the token to a file for future use
      const tokenFile = '/tmp/netsuite_access_token.txt';
      fs.writeFileSync(tokenFile, tokenResult.accessToken);
      console.log(`\n💾 Access token saved to ${tokenFile} for future use.`);
      console.log(`You can use it with: export netsuite_access_token=$(cat ${tokenFile})`);
    } else {
      console.log('\n❌ Failed to connect to NetSuite API with OAuth 2.0 JWT bearer token.');
      console.log('Please check the error messages above for more details.');
    }
    
    return {
      success: overallSuccess,
      tokenResult,
      apiRequestResult
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

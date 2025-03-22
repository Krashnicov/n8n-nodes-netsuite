/**
 * Test script for OAuth2 token retrieval
 * 
 * This script tests the OAuth2 token retrieval process for NetSuite
 * It uses the OAuth2 callback server to simulate the OAuth2 flow
 */

const axios = require('axios');
const { startOAuth2Server } = require('./oauth2-callback-server');
const { randomBytes } = require('crypto');

// Environment variables
const clientId = process.env.netsuite_client_id;
const clientSecret = process.env.netsuite_client_secret;
const accountId = process.env.netsuite_account_id;
const ngrokDomain = process.env.ngrok_domain;

// Check required environment variables
if (!clientId || !clientSecret || !accountId || !ngrokDomain) {
  console.error('Missing required environment variables:');
  if (!clientId) console.error('- netsuite_client_id');
  if (!clientSecret) console.error('- netsuite_client_secret');
  if (!accountId) console.error('- netsuite_account_id');
  if (!ngrokDomain) console.error('- ngrok_domain');
  process.exit(1);
}

// NetSuite OAuth2 endpoints
const authUri = 'https://system.netsuite.com/app/login/oauth2/authorize.nl';
const tokenUri = `https://${accountId}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`;

/**
 * Test the OAuth2 token retrieval
 */
async function testOAuth2TokenRetrieval() {
  console.log('Starting OAuth2 token retrieval test');
  console.log('----------------------------------------');
  console.log('Using the following configuration:');
  console.log(`- Client ID: ${clientId.substring(0, 5)}...`);
  console.log(`- Account ID: ${accountId}`);
  console.log(`- ngrok domain: ${ngrokDomain}`);
  console.log('----------------------------------------');

  try {
    // Start the OAuth2 server
    const server = await startOAuth2Server({
      clientId,
      clientSecret,
      tokenUrl: tokenUri,
      ngrokDomain,
    });

    // Generate a random state for security
    const state = randomBytes(16).toString('hex');

    // Create the authorization URL
    const authUrl = server.createAuthUrl(
      authUri,
      'restwebservices',
      state
    );

    console.log('----------------------------------------');
    console.log('Please open the following URL in your browser:');
    console.log(authUrl);
    console.log('----------------------------------------');
    console.log('Waiting for authentication to complete...');

    // Wait for the callback to complete
    const tokenData = await server.getTokenResponse(state);

    console.log('----------------------------------------');
    console.log('Token retrieval successful!');
    console.log('Access token:', tokenData.access_token.substring(0, 10) + '...');
    console.log('Refresh token:', tokenData.refresh_token.substring(0, 10) + '...');
    console.log('Token type:', tokenData.token_type);
    console.log('Expires in:', tokenData.expires_in, 'seconds');

    // Test the token with a simple API request
    console.log('----------------------------------------');
    console.log('Testing token with a simple API request...');

    try {
      const response = await axios({
        method: 'GET',
        url: `https://${accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/customer`,
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('API request successful!');
      console.log('Status code:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
    } catch (apiError) {
      console.error('API request failed:', apiError.message);
      if (apiError.response) {
        console.error('Status code:', apiError.response.status);
        console.error('Response data:', apiError.response.data);
      }
    }

    // Close the server
    server.close();
    console.log('----------------------------------------');
    console.log('Test completed');
  } catch (error) {
    console.error('Error during OAuth2 token retrieval test:', error.message);
    process.exit(1);
  }
}

// Run the test
testOAuth2TokenRetrieval();

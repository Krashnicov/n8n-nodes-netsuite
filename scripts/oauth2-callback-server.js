const express = require('express');
const axios = require('axios');
const { URL } = require('url');

// Create Express server
const app = express();
const PORT = 9999;

// Store for pending OAuth requests
const pendingRequests = new Map();

// Create a function to initialize the OAuth2 callback server
async function startOAuth2Server(options = {}) {
  const {
    clientId,
    clientSecret,
    tokenUrl,
    ngrokDomain = process.env.ngrok_domain,
  } = options;

  if (!ngrokDomain) {
    throw new Error('ngrok_domain environment variable is required');
  }

  // Define the callback URL
  // Ensure ngrokDomain doesn't already have https:// prefix
  const domain = ngrokDomain.replace(/^https?:\/\//, '');
  const callbackUrl = `https://${domain}/oauth/callback`;
  console.log(`OAuth2 callback URL: ${callbackUrl}`);

  // Route to handle OAuth callbacks
  app.get('/oauth/callback', async (req, res) => {
    try {
      console.log('Received OAuth callback with query:', req.query);
      const { code, state, error, error_description } = req.query;

      if (error) {
        console.error(`OAuth error: ${error}. Description: ${error_description}`);
        return res.status(400).send(`
          <html>
            <body>
              <h1>Authentication Error</h1>
              <p>Error: ${error}</p>
              <p>Description: ${error_description || 'No description provided'}</p>
              <p>Please close this window and try again.</p>
            </body>
          </html>
        `);
      }

      if (!code) {
        return res.status(400).send(`
          <html>
            <body>
              <h1>Authentication Error</h1>
              <p>No authorization code received</p>
              <p>Please close this window and try again.</p>
            </body>
          </html>
        `);
      }

      // Exchange code for token
      console.log(`Exchanging code for token using URL: ${tokenUrl}`);
      
      const tokenResponse = await axios.post(tokenUrl, {
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: clientId,
        client_secret: clientSecret,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('Token response received:', tokenResponse.status);
      
      // Store the token data for retrieval
      if (state && pendingRequests.has(state)) {
        pendingRequests.set(state, {
          status: 'success',
          data: tokenResponse.data,
        });
      }

      // Return success page
      return res.send(`
        <html>
          <body>
            <h1>Authentication Successful</h1>
            <p>You have successfully authenticated with NetSuite.</p>
            <p>You may close this window and return to n8n.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error in OAuth callback:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }

      // Store error for retrieval
      if (req.query.state && pendingRequests.has(req.query.state)) {
        pendingRequests.set(req.query.state, {
          status: 'error',
          error: error.message,
          details: error.response?.data,
        });
      }

      return res.status(500).send(`
        <html>
          <body>
            <h1>Authentication Error</h1>
            <p>An error occurred during the authentication process: ${error.message}</p>
            <p>Please close this window and try again.</p>
          </body>
        </html>
      `);
    }
  });

  // Start server
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      console.log(`OAuth2 callback server listening on port ${PORT}`);
      resolve({
        callbackUrl,
        createAuthUrl: (authUrl, scope, state) => {
          // Register a new pending request
          pendingRequests.set(state, { status: 'pending' });
          
          // Create the full authorization URL
          const url = new URL(authUrl);
          url.searchParams.append('client_id', clientId);
          url.searchParams.append('response_type', 'code');
          url.searchParams.append('redirect_uri', callbackUrl);
          url.searchParams.append('scope', scope);
          url.searchParams.append('state', state);
          
          return url.toString();
        },
        getTokenResponse: async (state, timeout = 180000) => {
          const startTime = Date.now();
          while (Date.now() - startTime < timeout) {
            if (pendingRequests.has(state)) {
              const request = pendingRequests.get(state);
              if (request.status !== 'pending') {
                pendingRequests.delete(state);
                if (request.status === 'error') {
                  throw new Error(request.error);
                }
                return request.data;
              }
            }
            // Wait 1 second before checking again
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          throw new Error('OAuth2 authentication timed out');
        },
        close: () => {
          server.close();
        },
      });
    });
  });
}

module.exports = { startOAuth2Server };

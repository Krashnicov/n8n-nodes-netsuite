import { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { IExecuteFunctions, NodeApiError } from 'n8n-workflow';
import { debuglog } from 'util';
import { exec } from 'child_process';
import { promisify } from 'util';
import { randomBytes, createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import jwt from 'jsonwebtoken';

const execAsync = promisify(exec);
const debug = debuglog('n8n-nodes-netsuite:oauth2');

export interface IOAuth2Options {
  clientId: string;
  clientSecret: string;
  accessTokenUri: string;
  authUri?: string;
  scope: string;
  accessToken?: string;
  refreshToken?: string;
  accountId: string;
  privateKeyPath?: string;
}

export class OAuth2Helper {
  private options: IOAuth2Options;
  private accessToken: string | undefined;
  private refreshToken: string | undefined;

  constructor(options: IOAuth2Options) {
    this.options = options;
    this.accessToken = options.accessToken;
    this.refreshToken = options.refreshToken;
    debug('OAuth2Helper initialized with options:', {
      clientId: options.clientId,
      accountId: options.accountId,
      hasAccessToken: !!options.accessToken,
      hasRefreshToken: !!options.refreshToken,
      hasPrivateKeyPath: !!options.privateKeyPath,
    });
  }
  
  /**
   * Generate a JWT token for NetSuite OAuth2 client credentials flow
   * 
   * Implements the JWT token generation for NetSuite OAuth2 client credentials flow
   * as described in the documentation:
   * https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_158081952044.html
   */
  private generateJwtToken(): string {
    try {
      debug('Generating JWT token for client credentials flow');
      
      // Check if private key path is provided
      const privateKeyPath = this.options.privateKeyPath || 
                            process.env.netsuite_private_key_path || 
                            path.join(process.env.HOME || '/home/ubuntu', '.ssh', 'netsuite_private_key.pem');
      
      debug(`Looking for private key at: ${privateKeyPath}`);
      
      let privateKey: string;
      
      // Check if private key file exists
      if (!fs.existsSync(privateKeyPath)) {
        debug(`Private key file not found at ${privateKeyPath}`);
        
        // If no private key file exists, try to generate a temporary one for testing
        if (process.env.DEBUG === 'true') {
          debug('Generating temporary key pair for testing...');
          
          // Generate a key pair
          const { privateKey: tempPrivateKey } = require('crypto').generateKeyPairSync('rsa', {
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
          
          // Save the private key to the specified path
          fs.writeFileSync(privateKeyPath, tempPrivateKey);
          debug(`Temporary private key saved to ${privateKeyPath}`);
          
          privateKey = tempPrivateKey;
        } else {
          throw new Error(`Private key file not found at ${privateKeyPath}`);
        }
      } else {
        // Read the private key
        privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        debug('Private key loaded successfully');
      }
      
      // Current time in seconds
      const now = Math.floor(Date.now() / 1000);
      
      // Token endpoint URL - EXACTLY as specified in the NetSuite documentation
      const tokenUrl = `https://${this.options.accountId}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`;
      
      // Parse scope string into array if it's a string
      let scopeArray: string[];
      if (typeof this.options.scope === 'string') {
        scopeArray = this.options.scope.split(/[\s,]+/).filter(Boolean);
      } else {
        scopeArray = [this.options.scope];
      }
      
      // JWT payload - EXACTLY as specified in the NetSuite documentation
      const payload = {
        iss: this.options.clientId, // Issuer - your client ID
        scope: scopeArray, // Scope - the permissions you're requesting
        aud: tokenUrl, // Audience - the token endpoint URL
        exp: now + 3600, // Expiration time - 1 hour from now
        iat: now, // Issued at time - now
      };
      
      debug('JWT payload:', JSON.stringify(payload, null, 2));
      
      // JWT options
      const options = {
        algorithm: 'RS256', // Required algorithm for NetSuite
      };
      
      // Generate the JWT token
      const token = jwt.sign(payload, privateKey, options as jwt.SignOptions);
      
      debug('JWT token generated successfully');
      
      if (process.env.DEBUG === 'true') {
        // Decode and print the token for debugging
        const decoded = jwt.decode(token, { complete: true });
        debug('Decoded JWT token:', JSON.stringify(decoded, null, 2));
      }
      
      return token;
    } catch (error: any) {
      debug('Failed to generate JWT token:', error.message);
      throw new Error(`Failed to generate JWT token: ${error.message}`);
    }
  }
  
  /**
   * Get access token using client credentials flow
   * 
   * Implements the OAuth2 client credentials flow for NetSuite
   * as described in the documentation:
   * https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_158081952044.html
   */
  async getAccessTokenWithClientCredentials(): Promise<string> {
    try {
      debug('Getting access token using client credentials flow');
      
      // Token endpoint URL - EXACTLY as specified in the NetSuite documentation
      const tokenUrl = `https://${this.options.accountId}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`;
      
      // Create token request body
      const tokenRequestBody = new URLSearchParams();
      
      // The value of the grant_type parameter is always client_credentials
      tokenRequestBody.append('grant_type', 'client_credentials');
      
      // Try client_id/client_secret flow first as it's simpler
      debug('Using client_id/client_secret flow for client credentials');
      tokenRequestBody.append('client_id', this.options.clientId);
      
      // Only add client_secret if it's provided
      if (this.options.clientSecret) {
        tokenRequestBody.append('client_secret', this.options.clientSecret);
      }
      
      // Add scope parameter for client_id/client_secret flow
      if (this.options.scope) {
        tokenRequestBody.append('scope', this.options.scope);
      }
      
      debug('Token request URL:', tokenUrl);
      debug('Token request payload:', tokenRequestBody.toString());
      
      // For debugging, print curl command
      if (process.env.DEBUG === 'true') {
        const curlCommand = `curl -X POST "${tokenUrl}" -H "Content-Type: application/x-www-form-urlencoded" -H "Accept: application/json" -d "${tokenRequestBody.toString().replace(/&/g, '\\&')}"`;
        debug('Curl command for testing:', curlCommand);
      }
      
      try {
        // Make token request - EXACTLY as specified in the NetSuite documentation
        const tokenResponse = await axios.post(tokenUrl, tokenRequestBody.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        });
        
        debug('Token request successful, status:', tokenResponse.status);
        
        if (process.env.DEBUG === 'true') {
          debug('Token response:', JSON.stringify(tokenResponse.data, null, 2));
        } else {
          debug('Token response received with access token');
        }
        
        // Store the tokens
        this.accessToken = tokenResponse.data.access_token;
        
        if (tokenResponse.data.refresh_token) {
          this.refreshToken = tokenResponse.data.refresh_token;
          debug('Refresh token received and stored');
        }
        
        return this.accessToken || '';
      } catch (clientCredentialsError: any) {
        // If client_id/client_secret flow fails, try JWT bearer flow
        debug('Client credentials flow failed, trying JWT bearer flow');
        debug('Error:', clientCredentialsError.message);
        
        if (clientCredentialsError.response) {
          debug('Response status:', clientCredentialsError.response.status);
          debug('Response data:', JSON.stringify(clientCredentialsError.response.data, null, 2));
        }
        
        // Reset token request body
        const jwtTokenRequestBody = new URLSearchParams();
        jwtTokenRequestBody.append('grant_type', 'client_credentials');
        
        try {
          // Generate JWT token
          const jwtToken = this.generateJwtToken();
          
          // The value of the client_assertion_type parameter is always urn:ietf:params:oauth:client-assertion-type:jwt-bearer
          jwtTokenRequestBody.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
          
          // The value of the client_assertion parameter is a JWT bearer token
          jwtTokenRequestBody.append('client_assertion', jwtToken);
          
          debug('Using JWT bearer flow for client credentials');
          debug('JWT token request payload:', jwtTokenRequestBody.toString());
          
          // Make JWT token request
          const jwtTokenResponse = await axios.post(tokenUrl, jwtTokenRequestBody.toString(), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            }
          });
          
          debug('JWT token request successful, status:', jwtTokenResponse.status);
          
          if (process.env.DEBUG === 'true') {
            debug('JWT token response:', JSON.stringify(jwtTokenResponse.data, null, 2));
          } else {
            debug('JWT token response received with access token');
          }
          
          // Store the tokens
          this.accessToken = jwtTokenResponse.data.access_token;
          
          if (jwtTokenResponse.data.refresh_token) {
            this.refreshToken = jwtTokenResponse.data.refresh_token;
            debug('Refresh token received and stored');
          }
          
          return this.accessToken || '';
        } catch (jwtError: any) {
          debug('JWT bearer flow failed:', jwtError.message);
          
          if (jwtError.response) {
            debug('JWT response status:', jwtError.response.status);
            debug('JWT response data:', JSON.stringify(jwtError.response.data, null, 2));
          }
          
          // Throw the original error from client credentials flow
          throw clientCredentialsError;
        }
      }
    } catch (error: any) {
      debug('Failed to get access token:', error.message);
      
      if (error.response) {
        debug('Response status:', error.response.status);
        debug('Response data:', JSON.stringify(error.response.data, null, 2));
        
        // Provide more specific error messages based on status codes
        if (error.response.status === 400) {
          if (error.response.data.error === 'invalid_request') {
            debug('Invalid request error - check request parameters and format');
          } else if (error.response.data.error === 'invalid_client') {
            debug('Invalid client error - check client credentials');
          }
        } else if (error.response.status === 401) {
          debug('Unauthorized - check client credentials and permissions');
        } else if (error.response.status === 500) {
          debug('Server error - NetSuite API may be experiencing issues');
        }
      }
      
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  /**
   * Get the authorization headers for NetSuite API requests
   */
  async getAuthorizationHeaders(): Promise<{ [key: string]: string }> {
    try {
      // If no access token is available, try to get one
      if (!this.accessToken) {
        debug('No access token available, attempting to get one');
        
        // Try to refresh the token if we have a refresh token
        if (this.refreshToken) {
          debug('Have refresh token, should implement token refresh');
          // Token refresh would be implemented here in a production environment
        } else {
          // Try to get a new token using client credentials flow
          debug('No refresh token available, using client credentials flow');
          await this.getAccessTokenWithClientCredentials();
        }
        
        // If still no access token, throw an error
        if (!this.accessToken) {
          throw new Error('Failed to obtain access token');
        }
      }
      
      return {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-NetSuite-PropertyNameValidation': 'strict',
      };
    } catch (error: any) {
      debug('Failed to get authorization headers:', error.message);
      throw error;
    }
  }

  /**
   * Get the base URL for NetSuite API requests
   */
  getBaseUrl(): string {
    return `https://${this.options.accountId}.suitetalk.api.netsuite.com`;
  }

  /**
   * Make a request to the NetSuite API
   */
  async makeRequest(config: AxiosRequestConfig): Promise<any> {
    try {
      // Ensure URL is absolute
      if (!config.url?.startsWith('http')) {
        config.url = `${this.getBaseUrl()}/${config.url?.startsWith('/') ? config.url.substring(1) : config.url}`;
      }

      debug('Making OAuth2 request to:', config.url);
      
      // Get authorization headers (this will obtain a token if needed)
      const authHeaders = await this.getAuthorizationHeaders();
      
      config.headers = {
        ...config.headers,
        ...authHeaders,
      };
      
      const response = await axios(config);
      debug('OAuth2 request successful, status:', response.status);
      return response;
    } catch (error: any) {
      debug('OAuth2 request failed:', error.message);
      
      if (error.response && error.response.status === 401) {
        // Handle authentication errors - try to refresh token and retry
        debug('Received 401 Unauthorized, attempting to refresh token and retry');
        
        try {
          // Clear the current access token
          this.accessToken = undefined;
          
          // Get new authorization headers (this will obtain a new token)
          const authHeaders = await this.getAuthorizationHeaders();
          
          // Update the request headers
          config.headers = {
            ...config.headers,
            ...authHeaders,
          };
          
          // Retry the request
          debug('Retrying request with new token');
          const response = await axios(config);
          debug('Retry successful, status:', response.status);
          return response;
        } catch (retryError: any) {
          // If retry fails, throw a more descriptive error
          const errorMessage = `Authentication failed (401 Unauthorized): ${error.response.data?.message || 'Invalid or expired token'}. Retry also failed: ${retryError.message}`;
          debug('OAuth2 authentication error:', errorMessage);
          throw new Error(errorMessage);
        }
      }
      
      throw error;
    }
  }

  /**
   * Handle NetSuite API response for n8n node execution
   */
  handleNetsuiteResponse(fns: IExecuteFunctions, response: any): { json: any } {
    debug('Handling NetSuite response, status:', response.status || response.statusCode);
    
    // Check for successful response using either status or statusCode
    if ((response.status && response.status >= 200 && response.status < 300) || 
        (response.statusCode && response.statusCode >= 200 && response.statusCode < 300)) {
      return { json: response.data || response.body };
    }
    
    // Handle error responses
    let message = `Request failed with status code ${response.status || response.statusCode}`;
    
    // Extract error details from either data or body
    const responseData = response.data || response.body;
    if (responseData && responseData.error) {
      message = responseData.error.message || responseData.error || message;
    }
    
    if (fns.continueOnFail() !== true) {
      // Create a more robust error object
      const error = new NodeApiError(fns.getNode(), responseData, { message });
      throw error;
    }
    
    return { json: { error: message } };
  }
  
  /**
   * Get the callback URL for OAuth2 authorization
   */
  private getCallbackUrlFromEnv(): string {
    // Get the ngrok domain from environment variable
    const ngrokDomain = process.env.ngrok_domain;
    if (!ngrokDomain) {
      throw new Error('Environment variable ngrok_domain is not set. It is required for OAuth2 callback URL.');
    }
    
    // Remove https:// prefix if present to prevent double https:// in the URL
    const domain = ngrokDomain.replace(/^https?:\/\//, '');
    return `https://${domain}/oauth/callback`;
  }
  
  /**
   * Generate PKCE code verifier and challenge
   */
  private generatePKCE(): { codeVerifier: string, codeChallenge: string } {
    // Generate code verifier (random string between 43-128 chars)
    const codeVerifier = randomBytes(32).toString('base64url');
    
    // Generate code challenge (SHA256 hash of code verifier, base64url encoded)
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    
    return { codeVerifier, codeChallenge };
  }
  
  /**
   * Start the OAuth2 callback server and the ngrok tunnel
   */
  private async startOAuth2Server(): Promise<any> {
    try {
      // Check if ngrok is already running, if not start it
      await this.ensureNgrokRunning();
      
      // Get the callback URL
      const callbackUrl = this.getCallbackUrlFromEnv();
      debug('Using callback URL:', callbackUrl);
      
      // Import the OAuth2 callback server
      const { startOAuth2Server } = require('../../scripts/oauth2-callback-server');
      
      return await startOAuth2Server({
        clientId: this.options.clientId,
        clientSecret: this.options.clientSecret,
        tokenUrl: this.options.accessTokenUri,
        ngrokDomain: process.env.ngrok_domain?.replace(/^https?:\/\//, ''),
      });
    } catch (error: any) {
      debug('Failed to start OAuth2 server:', error);
      throw new Error(`Failed to start OAuth2 server: ${error.message || String(error)}`);
    }
  }
  
  /**
   * Ensure ngrok is running with the correct domain
   */
  private async ensureNgrokRunning(): Promise<void> {
    try {
      // Check if ngrok is already running
      const { stdout } = await execAsync('pgrep -f "ngrok http"');
      if (stdout.trim()) {
        debug('ngrok is already running');
        return;
      }
    } catch (error) {
      // ngrok is not running, start it
      debug('ngrok is not running, starting it');
      
      // Get the ngrok domain from environment variable
      const ngrokDomain = process.env.ngrok_domain;
      if (!ngrokDomain) {
        throw new Error('Environment variable ngrok_domain is not set. It is required for OAuth2 callback URL.');
      }
      
      // Remove https:// prefix if present
      const domain = ngrokDomain.replace(/^https?:\/\//, '');
      
      // Start ngrok with the correct command format
      const command = `ngrok http --url=${domain} 9999`;
      debug('Starting ngrok with command:', command);
      
      exec(command, (error) => {
        if (error) {
          debug('Failed to start ngrok:', error);
        }
      });
      
      // Wait for ngrok to start
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  /**
   * Perform the OAuth2 authorization flow
   */
  async performAuthorizationFlow(): Promise<{ accessToken: string, refreshToken: string }> {
    if (!this.options.clientId || !this.options.clientSecret || !this.options.authUri || !this.options.accessTokenUri) {
      throw new Error('Missing required OAuth2 options');
    }
    
    debug('Starting OAuth2 authorization flow');
    
    // Generate PKCE values for enhanced security
    const { codeVerifier, codeChallenge } = this.generatePKCE();
    debug('Generated PKCE values:', { codeVerifier, codeChallenge });
    
    // Start the OAuth2 server
    const server = await this.startOAuth2Server();
    
    try {
      // Generate a random state for security
      const state = randomBytes(16).toString('hex');
      
      // Create the authorization URL with PKCE
      const authUrl = new URL(this.options.authUri);
      authUrl.searchParams.append('client_id', this.options.clientId);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('redirect_uri', this.getCallbackUrlFromEnv());
      authUrl.searchParams.append('scope', this.options.scope);
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('code_challenge', codeChallenge);
      authUrl.searchParams.append('code_challenge_method', 'S256');
      
      debug('Authorization URL:', authUrl.toString());
      
      // Show instructions to the user
      console.log('=======================================================');
      console.log('Please open the following URL in your browser:');
      console.log(authUrl.toString());
      console.log('=======================================================');
      console.log('Waiting for authentication to complete...');
      
      // Wait for the callback to complete
      const tokenData = await server.getTokenResponse(state, codeVerifier);
      
      debug('Received token data');
      
      // Store the tokens
      this.accessToken = tokenData.access_token;
      this.refreshToken = tokenData.refresh_token;
      
      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      };
    } finally {
      // Close the server
      server.close();
    }
  }
}

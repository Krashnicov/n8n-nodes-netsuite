import { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { IExecuteFunctions, NodeApiError } from 'n8n-workflow';
import { debuglog } from 'util';
import { exec } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';

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
    });
  }

  /**
   * Get the authorization headers for NetSuite API requests
   */
  getAuthorizationHeaders(): { [key: string]: string } {
    if (!this.accessToken) {
      // Try to refresh the token if we have a refresh token
      if (this.refreshToken) {
        debug('No access token available, but have refresh token. Should implement token refresh.');
        // Token refresh would be implemented here in a production environment
      }
      throw new Error('No access token available');
    }
    
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-NetSuite-PropertyNameValidation': 'strict',
    };
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
      
      config.headers = {
        ...config.headers,
        ...this.getAuthorizationHeaders(),
      };
      
      const response = await axios(config);
      debug('OAuth2 request successful, status:', response.status);
      return response;
    } catch (error: any) {
      debug('OAuth2 request failed:', error.message);
      
      if (error.response && error.response.status === 401) {
        // Handle authentication errors
        const errorMessage = `Authentication failed (401 Unauthorized): ${error.response.data?.message || 'Invalid or expired token'}`;
        debug('OAuth2 authentication error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  }

  /**
   * Handle NetSuite API response for n8n node execution
   */
  handleNetsuiteResponse(fns: IExecuteFunctions, response: any): { json: any } {
    debug('Handling NetSuite response, status:', response.status);
    
    if (response.status >= 200 && response.status < 300) {
      return { json: response.data };
    }
    
    // Handle error responses
    let message = `Request failed with status code ${response.status}`;
    
    if (response.data && response.data.error) {
      message = response.data.error.message || message;
    }
    
    if (fns.continueOnFail() !== true) {
      const error = new NodeApiError(fns.getNode(), response.data);
      error.message = message;
      throw error;
    }
    
    return { json: { error: message } };
  }
  
  /**
   * Get the callback URL for OAuth2 authorization
   */
  // Get the callback URL for OAuth2 authorization
  private getCallbackUrlFromEnv(): string {
    // Get the ngrok domain from environment variable
    const ngrokDomain = process.env.ngrok_domain;
    if (!ngrokDomain) {
      throw new Error('Environment variable ngrok_domain is not set. It is required for OAuth2 callback URL.');
    }
    
    return `https://${ngrokDomain}/oauth/callback`;
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
        ngrokDomain: process.env.ngrok_domain,
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
      const { stdout } = await execAsync('pgrep -f "ngrok http 9999"');
      if (stdout.trim()) {
        debug('ngrok is already running');
        return;
      }
    } catch (error) {
      // ngrok is not running, start it
      debug('ngrok is not running, starting it');
      
      // Start ngrok in the background
      exec('cd ~/repos/n8n-nodes-netsuite && pnpm run tunnel &', (error) => {
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
    
    // Start the OAuth2 server
    const server = await this.startOAuth2Server();
    
    try {
      // Generate a random state for security
      const state = randomBytes(16).toString('hex');
      
      // Create the authorization URL
      const authUrl = server.createAuthUrl(
        this.options.authUri,
        this.options.scope,
        state
      );
      
      debug('Authorization URL:', authUrl);
      
      // Show instructions to the user
      console.log('=======================================================');
      console.log('Please open the following URL in your browser:');
      console.log(authUrl);
      console.log('=======================================================');
      console.log('Waiting for authentication to complete...');
      
      // Wait for the callback to complete
      const tokenData = await server.getTokenResponse(state);
      
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

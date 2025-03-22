import { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { IExecuteFunctions, NodeApiError } from 'n8n-workflow';
import { debuglog } from 'util';

const debug = debuglog('n8n-nodes-netsuite:oauth2');

export interface IOAuth2Options {
  clientId: string;
  clientSecret: string;
  accessTokenUri: string;
  scope: string;
  accessToken?: string;
  refreshToken?: string;
  accountId: string;
}

export class OAuth2Helper {
  private options: IOAuth2Options;
  private accessToken: string | undefined;

  constructor(options: IOAuth2Options) {
    this.options = options;
    this.accessToken = options.accessToken;
    debug('OAuth2Helper initialized with options:', {
      clientId: options.clientId,
      accountId: options.accountId,
      hasAccessToken: !!options.accessToken,
    });
  }

  /**
   * Get the authorization headers for NetSuite API requests
   */
  getAuthorizationHeaders(): { [key: string]: string } {
    if (!this.accessToken) {
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
}

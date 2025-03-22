import axios from 'axios';
import { OAuth2Helper } from '../nodes/NetSuite/OAuth2Helper';

// Mock axios
jest.mock('axios');

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn((command, callback) => {
    if (callback) callback(null, { stdout: 'success' });
    return { stdout: 'success' };
  }),
  execSync: jest.fn(),
}));

// Mock the OAuth2 callback server
jest.mock('../scripts/oauth2-callback-server', () => ({
  startOAuth2Server: jest.fn().mockResolvedValue({
    callbackUrl: 'https://test-domain.ngrok-free.app/oauth/callback',
    createAuthUrl: jest.fn().mockReturnValue('https://test-auth-url.com'),
    getTokenResponse: jest.fn().mockResolvedValue({
      access_token: process.env.netsuite_access_token || 'test-access-token',
      refresh_token: process.env.netsuite_refresh_token || 'test-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer'
    }),
    close: jest.fn(),
  }),
}));

describe('OAuth2 Authentication', () => {
  let oauth2Helper: OAuth2Helper;
  
  beforeEach(() => {
    // Set up environment variables
    process.env.ngrok_domain = process.env.ngrok_domain || 'test-domain.ngrok-free.app';
    
    // Get credentials from environment variables
    const clientId = process.env.netsuite_client_id || 'test-client-id';
    const clientSecret = process.env.netsuite_client_secret || 'test-client-secret';
    const accountId = process.env.netsuite_account_id || 'test-account';
    const accessToken = process.env.netsuite_access_token || 'test-access-token';
    const refreshToken = process.env.netsuite_refresh_token || 'test-refresh-token';
    
    // Create OAuth2Helper instance with real credentials if available
    oauth2Helper = new OAuth2Helper({
      clientId,
      clientSecret,
      accessTokenUri: `https://${accountId}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`,
      authUri: 'https://system.netsuite.com/app/login/oauth2/authorize.nl',
      scope: 'restwebservices',
      accountId,
      accessToken,
      refreshToken,
    });
    
    // Set access token for API request tests
    (oauth2Helper as any).accessToken = accessToken;
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should successfully authenticate and retrieve a token', async () => {
    // Skip this test if no client credentials are available
    if (!process.env.netsuite_client_id || !process.env.netsuite_client_secret) {
      console.log('Skipping OAuth2 authentication test - no client credentials available');
      return;
    }
    
    // Mock console.log to prevent output during tests
    const originalConsoleLog = console.log;
    console.log = jest.fn();
    
    try {
      const result = await (oauth2Helper as any).performAuthorizationFlow();
      
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      
      // Verify tokens are stored in the instance
      expect((oauth2Helper as any).accessToken).toBeTruthy();
      expect((oauth2Helper as any).refreshToken).toBeTruthy();
    } finally {
      // Restore console.log
      console.log = originalConsoleLog;
    }
  });
  
  it('should make a successful API request with OAuth2 authentication', async () => {
    // Skip this test if no access token is available
    if (!process.env.netsuite_access_token) {
      console.log('Skipping OAuth2 API request test - no access token available');
      return;
    }
    
    // Mock successful API response
    const mockApiResponse = {
      status: 200,
      data: {
        items: [
          { id: '123', name: 'Test Record' }
        ]
      }
    };
    
    (axios as unknown as jest.Mock).mockResolvedValueOnce(mockApiResponse);
    
    const result = await oauth2Helper.makeRequest({
      url: '/services/rest/record/v1/customer',
      method: 'GET'
    });
    
    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty('items');
    
    // Verify headers were set correctly
    expect(axios).toHaveBeenCalledWith(expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': expect.stringContaining('Bearer '),
        'Content-Type': 'application/json',
      })
    }));
  });
  
  it('should handle NetSuite API response for successful search operation', async () => {
    // Mock execute functions
    const mockExecuteFunctions = {
      getNode: jest.fn().mockReturnValue({ name: 'NetSuite' }),
      continueOnFail: jest.fn().mockReturnValue(false),
    };
    
    // Mock successful search response using real data structure
    const mockSearchResponse = {
      status: 200,
      data: {
        count: 2,
        items: [
          { id: '123', name: 'Test Customer 1' },
          { id: '456', name: 'Test Customer 2' }
        ],
        hasMore: false,
        offset: 0,
        totalResults: 2
      }
    };
    
    const result = oauth2Helper.handleNetsuiteResponse(mockExecuteFunctions as any, mockSearchResponse as any);
    
    expect(result).toHaveProperty('json');
    expect(result.json).toHaveProperty('count');
    expect(result.json).toHaveProperty('items');
  });
  
  it('should handle authentication errors with 401 status code', async () => {
    // Mock authentication error
    const mockError = {
      response: {
        status: 401,
        data: { error: 'invalid_token' },
      },
      message: 'Request failed with status code 401',
    };
    
    (axios as unknown as jest.Mock).mockRejectedValueOnce(mockError);
    
    try {
      await oauth2Helper.makeRequest({
        url: '/services/rest/record/v1/customer',
        method: 'GET'
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain('401');
    }
  });
});

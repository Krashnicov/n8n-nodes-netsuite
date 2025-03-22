import { OAuth2Helper } from '../nodes/NetSuite/OAuth2Helper';

// Import axios first
import axios from 'axios';

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

describe('OAuth2Helper', () => {
  let options: any;
  let oauth2Helper: OAuth2Helper;

  beforeEach(() => {
    options = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      accessTokenUri: 'https://accounts.netsuite.com/services/oauth2/token',
      authUri: 'https://system.netsuite.com/app/login/oauth2/authorize.nl',
      scope: 'restwebservices',
      accountId: 'test-account',
    };
    
    oauth2Helper = new OAuth2Helper(options);
    
    // Mock environment variable
    process.env.ngrok_domain = 'test-ngrok-domain.ngrok-free.app';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.ngrok_domain;
  });

  it('should be defined', () => {
    expect(oauth2Helper).toBeDefined();
  });

  it('should generate authorization headers', () => {
    // Set access token first
    (oauth2Helper as any).accessToken = 'test-access-token';
    
    const headers = oauth2Helper.getAuthorizationHeaders();
    
    expect(headers).toEqual({
      'Authorization': 'Bearer test-access-token',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-NetSuite-PropertyNameValidation': 'strict',
    });
  });

  it('should throw error when no access token is available', () => {
    expect(() => {
      oauth2Helper.getAuthorizationHeaders();
    }).toThrow('No access token available');
  });

  it('should get the correct base URL', () => {
    const baseUrl = oauth2Helper.getBaseUrl();
    expect(baseUrl).toBe('https://test-account.suitetalk.api.netsuite.com');
  });

  it('should make a successful API request', async () => {
    // Set access token first
    (oauth2Helper as any).accessToken = 'test-access-token';
    
    const mockResponse = {
      status: 200,
      data: { success: true },
    };
    
    // Mock axios implementation for this test
    (axios as unknown as jest.Mock).mockResolvedValue(mockResponse);
    
    const result = await oauth2Helper.makeRequest({
      url: '/test',
      method: 'GET',
    });
    
    expect(result).toEqual(mockResponse);
    expect(axios).toHaveBeenCalledWith({
      url: 'https://test-account.suitetalk.api.netsuite.com/test',
      method: 'GET',
      headers: expect.objectContaining({
        'Authorization': 'Bearer test-access-token',
      }),
    });
  });

  it('should handle API request errors', async () => {
    // Set access token first
    (oauth2Helper as any).accessToken = 'test-access-token';
    
    const mockError = {
      response: {
        status: 401,
        data: { error: 'invalid_token' },
      },
      message: 'Request failed with status code 401',
    };
    
    // Mock axios implementation for this test
    (axios as unknown as jest.Mock).mockRejectedValue(mockError);
    
    await expect(oauth2Helper.makeRequest({
      url: '/test',
      method: 'GET',
    })).rejects.toThrow();
  });

  it('should handle NetSuite API response for successful requests', () => {
    const mockExecuteFunctions = {
      getNode: jest.fn().mockReturnValue({ name: 'NetSuite' }),
      continueOnFail: jest.fn().mockReturnValue(false),
    };
    
    const mockResponse = {
      statusCode: 200,
      body: { success: true },
    };
    
    const result = oauth2Helper.handleNetsuiteResponse(mockExecuteFunctions as any, mockResponse as any);
    
    expect(result).toEqual({ json: { success: true } });
  });

  it('should handle NetSuite API response for failed requests with continueOnFail', () => {
    const mockExecuteFunctions = {
      getNode: jest.fn().mockReturnValue({ name: 'NetSuite' }),
      continueOnFail: jest.fn().mockReturnValue(true),
    };
    
    const mockResponse = {
      statusCode: 400,
      body: { error: 'Bad Request' },
    };
    
    const result = oauth2Helper.handleNetsuiteResponse(mockExecuteFunctions as any, mockResponse as any);
    
    expect(result).toEqual({ json: { error: 'Bad Request' } });
  });

  it('should get callback URL from environment variable', () => {
    const callbackUrl = (oauth2Helper as any).getCallbackUrlFromEnv();
    expect(callbackUrl).toBe('https://test-ngrok-domain.ngrok-free.app/oauth/callback');
  });

  it('should throw error when ngrok_domain environment variable is not set', () => {
    delete process.env.ngrok_domain;
    
    expect(() => {
      (oauth2Helper as any).getCallbackUrlFromEnv();
    }).toThrow('Environment variable ngrok_domain is not set');
  });
});

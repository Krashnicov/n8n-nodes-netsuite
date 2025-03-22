import { OAuth2Helper } from '../nodes/NetSuite/OAuth2Helper';

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
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer'
    }),
    close: jest.fn(),
  }),
}));

describe('OAuth2 Flow', () => {
  let oauth2Helper: OAuth2Helper;
  
  beforeEach(() => {
    // Set up environment variables
    process.env.ngrok_domain = 'test-domain.ngrok-free.app';
    
    // Create OAuth2Helper instance
    oauth2Helper = new OAuth2Helper({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      accessTokenUri: 'https://test-token-url.com',
      authUri: 'https://test-auth-url.com',
      scope: 'restwebservices',
      accountId: 'test-account',
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.ngrok_domain;
  });
  
  it('should get callback URL from environment variable', () => {
    const callbackUrl = (oauth2Helper as any).getCallbackUrlFromEnv();
    expect(callbackUrl).toBe('https://test-domain.ngrok-free.app/oauth/callback');
  });
  
  it('should throw error when ngrok_domain is not set', () => {
    delete process.env.ngrok_domain;
    
    expect(() => {
      (oauth2Helper as any).getCallbackUrlFromEnv();
    }).toThrow('Environment variable ngrok_domain is not set');
  });
  
  it('should start OAuth2 server', async () => {
    const server = await (oauth2Helper as any).startOAuth2Server();
    
    expect(server).toBeDefined();
    expect(server.callbackUrl).toBe('https://test-domain.ngrok-free.app/oauth/callback');
    expect(server.createAuthUrl).toBeDefined();
    expect(server.getTokenResponse).toBeDefined();
    expect(server.close).toBeDefined();
  });
  
  it('should perform authorization flow and return tokens', async () => {
    // Mock console.log to prevent output during tests
    const originalConsoleLog = console.log;
    console.log = jest.fn();
    
    try {
      const result = await (oauth2Helper as any).performAuthorizationFlow();
      
      expect(result).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      });
      
      // Verify tokens are stored in the instance
      expect((oauth2Helper as any).accessToken).toBe('test-access-token');
      expect((oauth2Helper as any).refreshToken).toBe('test-refresh-token');
    } finally {
      // Restore console.log
      console.log = originalConsoleLog;
    }
  });
  
  it('should throw error when OAuth2 options are missing', async () => {
    // Create OAuth2Helper with missing options
    const incompleteOAuth2Helper = new OAuth2Helper({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      accessTokenUri: 'https://test-token-url.com',
      // Missing authUri
      scope: 'restwebservices',
      accountId: 'test-account',
    });
    
    await expect((incompleteOAuth2Helper as any).performAuthorizationFlow())
      .rejects.toThrow('Missing required OAuth2 options');
  });
});

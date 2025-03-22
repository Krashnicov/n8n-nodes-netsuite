import { IExecuteFunctions } from 'n8n-workflow';
import { NetSuite } from '../nodes/NetSuite/NetSuite.node';
import { OAuth2Helper } from '../nodes/NetSuite/OAuth2Helper';

// Mock OAuth2Helper
jest.mock('../nodes/NetSuite/OAuth2Helper');

describe('NetSuite Node', () => {
  let netsuiteNode: NetSuite;
  let mockExecuteFunctions: IExecuteFunctions;

  beforeEach(() => {
    netsuiteNode = new NetSuite();
    
    // Mock execute functions
    mockExecuteFunctions = {
      getNodeParameter: jest.fn((param) => {
        if (param === 'options') return { concurrency: 1 };
        return undefined;
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getCredentials: jest.fn(),
      helpers: {
        returnJsonArray: jest.fn(),
      },
      continueOnFail: jest.fn().mockReturnValue(false),
      getNode: jest.fn().mockReturnValue({ name: 'NetSuite' }),
    } as unknown as IExecuteFunctions;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should initialize with OAuth2 credentials when authentication is set to oauth2', async () => {
      // Mock credentials
      const mockCredentials = {
        authentication: 'oauth2',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        accessTokenUri: 'https://test.com/token',
        authUri: 'https://test.com/auth',
        scope: 'restwebservices',
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        accountId: 'test-account',
      };

      // Setup mocks
      (mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(mockCredentials);
      (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((param) => {
        if (param === 'resource') return 'record';
        if (param === 'operation') return 'get';
        if (param === 'recordType') return 'customer';
        if (param === 'recordId') return '123';
        return undefined;
      });

      // Mock OAuth2Helper implementation
      const mockMakeRequest = jest.fn().mockResolvedValue({
        status: 200,
        data: { id: '123', name: 'Test Customer' },
      });

      (OAuth2Helper as jest.Mock).mockImplementation(() => ({
        getAuthorizationHeaders: jest.fn().mockReturnValue({
          'Authorization': 'Bearer test-access-token',
          'Content-Type': 'application/json',
        }),
        makeRequest: mockMakeRequest,
        getBaseUrl: jest.fn().mockReturnValue('https://test-account.suitetalk.api.netsuite.com'),
        handleNetsuiteResponse: jest.fn().mockImplementation((_, response) => ({ json: response.data })),
      }));

      // Execute the node
      await netsuiteNode.execute.call(mockExecuteFunctions);

      // Verify OAuth2Helper was initialized with correct parameters
      expect(OAuth2Helper).toHaveBeenCalledWith({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        accessTokenUri: 'https://test.com/token',
        authUri: 'https://test.com/auth',
        scope: 'restwebservices',
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        accountId: 'test-account',
      });

      // Verify makeRequest was called with correct parameters
      expect(mockMakeRequest).toHaveBeenCalled();
    });

    it('should use OAuth1 authentication when authentication is set to oauth1', async () => {
      // Mock credentials
      const mockCredentials = {
        authentication: 'oauth1',
        consumerKey: 'test-consumer-key',
        consumerSecret: 'test-consumer-secret',
        tokenKey: 'test-token-key',
        tokenSecret: 'test-token-secret',
        accountId: 'test-account',
        hostname: 'test.suitetalk.api.netsuite.com',
      };

      // Setup mocks
      (mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(mockCredentials);
      (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((param) => {
        if (param === 'resource') return 'record';
        if (param === 'operation') return 'get';
        if (param === 'recordType') return 'customer';
        if (param === 'recordId') return '123';
        return undefined;
      });

      // Execute the node
      await netsuiteNode.execute.call(mockExecuteFunctions);

      // Verify OAuth2Helper was not initialized
      expect(OAuth2Helper).not.toHaveBeenCalled();
    });
  });
});

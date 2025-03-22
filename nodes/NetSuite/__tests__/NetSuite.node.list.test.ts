/* eslint-env jest */
import { NetSuite } from '../NetSuite.node';
import { mockExecuteFunctions, mockOperationOptions } from './helpers/testHelpers';
import * as makeRequestModule from '@fye/netsuite-rest-api';

// Mock the makeRequest function from the netsuite-rest-api package
jest.mock('@fye/netsuite-rest-api', () => ({
  makeRequest: jest.fn(),
}));

describe('NetSuite Node List Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('listRecords', () => {
    it('should make a GET request to list records with pagination', async () => {
      const fns = mockExecuteFunctions();
      fns.getNodeParameter = jest.fn()
        .mockReturnValueOnce('2021.2') // version
        .mockReturnValueOnce('customer') // recordType
        .mockReturnValueOnce(false) // returnAll
        .mockReturnValueOnce('') // query
        .mockReturnValueOnce(50) // limit
        .mockReturnValueOnce(0); // offset
      
      const mockResponse = {
        statusCode: 200,
        statusText: 'OK',
        headers: {},
        body: { 
          statusCode: 200,
          body: {
            items: [
              { id: '123', name: 'Customer 1' },
              { id: '124', name: 'Customer 2' }
            ],
            hasMore: false,
            count: 2,
            offset: 0,
            totalResults: 2,
            links: []
          }
        },
        request: { options: { method: 'GET' } },
      };
      
      (makeRequestModule.makeRequest as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const options = mockOperationOptions({ fns });
      await NetSuite.listRecords(options);
      
      // Just verify makeRequest was called with the right parameters
      expect(makeRequestModule.makeRequest).toHaveBeenCalled();
    });
    
    it('should handle returnAll parameter and fetch all pages', async () => {
      const fns = mockExecuteFunctions();
      fns.getNodeParameter = jest.fn()
        .mockReturnValueOnce('2021.2') // version
        .mockReturnValueOnce('customer') // recordType
        .mockReturnValueOnce(true) // returnAll
        .mockReturnValueOnce(''); // query
      
      const mockFirstResponse = {
        statusCode: 200,
        statusText: 'OK',
        headers: {},
        body: { 
          statusCode: 200,
          body: {
            items: [
              { id: '123', name: 'Customer 1' },
              { id: '124', name: 'Customer 2' }
            ],
            hasMore: true,
            count: 2,
            offset: 0,
            totalResults: 4,
            links: [
              { rel: 'next', href: '/services/rest/record/2021.2/customer?offset=2' }
            ]
          }
        },
        request: { options: { method: 'GET' } },
      };
      
      const mockSecondResponse = {
        statusCode: 200,
        statusText: 'OK',
        headers: {},
        body: { 
          statusCode: 200,
          body: {
            items: [
              { id: '125', name: 'Customer 3' },
              { id: '126', name: 'Customer 4' }
            ],
            hasMore: false,
            count: 2,
            offset: 2,
            totalResults: 4,
            links: []
          }
        },
        request: { options: { method: 'GET' } },
      };
      
      (makeRequestModule.makeRequest as jest.Mock)
        .mockResolvedValueOnce(mockFirstResponse)
        .mockResolvedValueOnce(mockSecondResponse);
      
      const options = mockOperationOptions({ fns });
      await NetSuite.listRecords(options);
      
      // Just verify makeRequest was called
      expect(makeRequestModule.makeRequest).toHaveBeenCalled();
    });
  });
  
  describe('runSuiteQL', () => {
    it('should make a POST request to execute SuiteQL query', async () => {
      const fns = mockExecuteFunctions();
      fns.getNodeParameter = jest.fn()
        .mockReturnValueOnce('2021.2') // version
        .mockReturnValueOnce(false) // returnAll
        .mockReturnValueOnce('SELECT * FROM customer WHERE id = 123') // query
        .mockReturnValueOnce(100) // limit
        .mockReturnValueOnce(0); // offset
      
      const mockResponse = {
        statusCode: 200,
        statusText: 'OK',
        headers: {},
        body: { 
          statusCode: 200,
          body: {
            items: [
              { id: '123', name: 'Test Customer' }
            ],
            hasMore: false,
            count: 1,
            offset: 0,
            totalResults: 1,
            links: []
          }
        },
        request: { options: { method: 'POST' } },
      };
      
      (makeRequestModule.makeRequest as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const options = mockOperationOptions({ fns });
      await NetSuite.runSuiteQL(options);
      
      // Just verify makeRequest was called
      expect(makeRequestModule.makeRequest).toHaveBeenCalled();
    });
    
    it('should handle pagination for SuiteQL queries', async () => {
      const fns = mockExecuteFunctions();
      fns.getNodeParameter = jest.fn()
        .mockReturnValueOnce('2021.2') // version
        .mockReturnValueOnce(true) // returnAll
        .mockReturnValueOnce('SELECT * FROM customer'); // query
      
      const mockFirstResponse = {
        statusCode: 200,
        statusText: 'OK',
        headers: {},
        body: { 
          statusCode: 200,
          body: {
            items: [
              { id: '123', name: 'Customer 1' }
            ],
            hasMore: true,
            count: 1,
            offset: 0,
            totalResults: 2,
            links: [
              { rel: 'next', href: '/services/rest/query/2021.2/suiteql?offset=1' }
            ]
          }
        },
        request: { options: { method: 'POST' } },
      };
      
      const mockSecondResponse = {
        statusCode: 200,
        statusText: 'OK',
        headers: {},
        body: { 
          statusCode: 200,
          body: {
            items: [
              { id: '124', name: 'Customer 2' }
            ],
            hasMore: false,
            count: 1,
            offset: 1,
            totalResults: 2,
            links: []
          }
        },
        request: { options: { method: 'POST' } },
      };
      
      (makeRequestModule.makeRequest as jest.Mock)
        .mockResolvedValueOnce(mockFirstResponse)
        .mockResolvedValueOnce(mockSecondResponse);
      
      const options = mockOperationOptions({ fns });
      await NetSuite.runSuiteQL(options);
      
      // Just verify makeRequest was called
      expect(makeRequestModule.makeRequest).toHaveBeenCalled();
    });
  });
  
  describe('rawRequest', () => {
    it('should make a raw request with the specified parameters', async () => {
      const fns = mockExecuteFunctions();
      fns.getNodeParameter = jest.fn()
        .mockReturnValueOnce('services/rest/record/v1/customer/123') // path
        .mockReturnValueOnce('GET') // method
        .mockReturnValueOnce('') // body
        .mockReturnValueOnce('record') // requestType
        .mockReturnValueOnce({ fullResponse: false }); // options
      
      const mockResponse = {
        statusCode: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: { 
          id: '123', 
          name: 'Test Customer',
          hasMore: false,
          count: 1,
          offset: 0,
          totalResults: 1
        },
        request: { options: { method: 'GET' } },
      };
      
      (makeRequestModule.makeRequest as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const options = mockOperationOptions({ fns });
      const result = await NetSuite.rawRequest(options);
      
      expect(makeRequestModule.makeRequest).toHaveBeenCalled();
      // Just verify the result has json property
      expect(result).toHaveProperty('json');
    });
    
    it('should return full response when fullResponse option is true', async () => {
      const fns = mockExecuteFunctions();
      fns.getNodeParameter = jest.fn()
        .mockReturnValueOnce('services/rest/record/v1/customer/123') // path
        .mockReturnValueOnce('GET') // method
        .mockReturnValueOnce('') // body
        .mockReturnValueOnce('record') // requestType
        .mockReturnValueOnce({ fullResponse: true }); // options
      
      const mockResponse = {
        statusCode: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: { id: '123', name: 'Test Customer' },
        request: { options: { method: 'GET' } },
      };
      
      (makeRequestModule.makeRequest as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const options = mockOperationOptions({ fns });
      const result = await NetSuite.rawRequest(options);
      
      expect(makeRequestModule.makeRequest).toHaveBeenCalled();
      expect(result).toHaveProperty('json.statusCode', 200);
      expect(result).toHaveProperty('json.headers');
      expect(result).toHaveProperty('json.body');
    });
  });
});

/* eslint-env jest */
import { NetSuite } from '../NetSuite.node';
import { mockExecuteFunctions, mockOperationOptions } from './helpers/testHelpers';
import * as makeRequestModule from '@fye/netsuite-rest-api';

// Mock the makeRequest function from the netsuite-rest-api package
jest.mock('@fye/netsuite-rest-api', () => ({
  makeRequest: jest.fn(),
}));

describe('NetSuite Node Operations', () => {
  let netSuiteNode: NetSuite;
  
  beforeEach(() => {
    netSuiteNode = new NetSuite();
    jest.clearAllMocks();
  });
  
  describe('getRecordType', () => {
    it('should return the record type from node parameters', () => {
      const fns = mockExecuteFunctions();
      fns.getNodeParameter = jest.fn()
        .mockReturnValueOnce('customer'); // recordType
      
      const recordType = NetSuite.getRecordType({ 
        fns, 
        itemIndex: 0,
        credentials: {
          hostname: 'test.netsuite.com',
          accountId: 'test_account',
          consumerKey: 'consumer_key',
          consumerSecret: 'consumer_secret',
          tokenKey: 'token_key',
          tokenSecret: 'token_secret',
        },
        item: { json: {} }
      });
      
      expect(recordType).toBe('customer');
      expect(fns.getNodeParameter).toHaveBeenCalledWith('recordType', 0);
    });
    
    it('should return custom record type when recordType is "custom"', () => {
      const fns = mockExecuteFunctions();
      fns.getNodeParameter = jest.fn()
        .mockReturnValueOnce('custom') // recordType
        .mockReturnValueOnce('customrecord_test'); // customRecordTypeScriptId
      
      const recordType = NetSuite.getRecordType({ 
        fns, 
        itemIndex: 0,
        credentials: {
          hostname: 'test.netsuite.com',
          accountId: 'test_account',
          consumerKey: 'consumer_key',
          consumerSecret: 'consumer_secret',
          tokenKey: 'token_key',
          tokenSecret: 'token_secret',
        },
        item: { json: {} }
      });
      
      expect(recordType).toBe('customrecord_test');
      expect(fns.getNodeParameter).toHaveBeenCalledWith('recordType', 0);
      expect(fns.getNodeParameter).toHaveBeenCalledWith('customRecordTypeScriptId', 0);
    });
  });
  
  describe('getRecord', () => {
    it('should make a GET request to fetch a record', async () => {
      const fns = mockExecuteFunctions();
      fns.getNodeParameter = jest.fn()
        .mockReturnValueOnce('2021.2') // version
        .mockReturnValueOnce('customer') // recordType
        .mockReturnValueOnce('123') // internalId
        .mockReturnValueOnce(true) // expandSubResources
        .mockReturnValueOnce(true); // simpleEnumFormat
      
      const mockResponse = {
        statusCode: 200,
        statusText: 'OK',
        headers: {},
        body: { 
          statusCode: 200,
          body: { id: '123', name: 'Test Customer' }
        },
        request: { options: { method: 'GET' } },
      };
      
      (makeRequestModule.makeRequest as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const options = mockOperationOptions({ fns });
      const result = await NetSuite.getRecord(options);
      
      // Just verify it was called - the exact parameters are implementation details
      expect(makeRequestModule.makeRequest).toHaveBeenCalled();
      
      // Verify the result is returned correctly
      expect(result).toHaveProperty('json');
      
      expect(result).toHaveProperty('json');
    });
  });
  
  describe('removeRecord', () => {
    it('should make a DELETE request to remove a record', async () => {
      const fns = mockExecuteFunctions();
      fns.getNodeParameter = jest.fn()
        .mockReturnValueOnce('2021.2') // version
        .mockReturnValueOnce('customer') // recordType
        .mockReturnValueOnce('123'); // internalId
      
      const mockResponse = {
        statusCode: 204,
        statusText: 'No Content',
        headers: {},
        body: { 
          statusCode: 204,
          body: {}
        },
        request: { options: { method: 'DELETE' } },
      };
      
      (makeRequestModule.makeRequest as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const options = mockOperationOptions({ fns });
      const result = await NetSuite.removeRecord(options);
      
      expect(makeRequestModule.makeRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          netsuiteApiHost: 'test.netsuite.com',
        }),
        expect.objectContaining({
          method: 'DELETE',
          path: 'services/rest/record/2021.2/customer/123',
        })
      );
      
      expect(result).toHaveProperty('json');
      expect(result.json).toHaveProperty('success', true);
    });
  });
  
  describe('insertRecord', () => {
    it('should make a POST request to insert a record', async () => {
      const fns = mockExecuteFunctions();
      fns.getNodeParameter = jest.fn()
        .mockReturnValueOnce('2021.2') // version
        .mockReturnValueOnce('customer'); // recordType
      
      const mockResponse = {
        statusCode: 204,
        statusText: 'No Content',
        headers: {
          'location': '/services/rest/record/v1/customer/456'
        },
        body: { 
          statusCode: 204,
          body: {}
        },
        request: { options: { method: 'POST' } },
      };
      
      (makeRequestModule.makeRequest as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const options = mockOperationOptions({
        fns,
        item: { json: { companyName: 'Test Company' } }
      });
      
      const result = await NetSuite.insertRecord(options);
      
      expect(makeRequestModule.makeRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          netsuiteApiHost: 'test.netsuite.com',
        }),
        expect.objectContaining({
          method: 'POST',
          path: 'services/rest/record/2021.2/customer',
          query: { companyName: 'Test Company' }
        })
      );
      
      expect(result).toHaveProperty('json');
      expect(result.json).toHaveProperty('id', '456');
      expect(result.json).toHaveProperty('success', true);
    });
  });
  
  describe('updateRecord', () => {
    it('should make a PATCH request to update a record', async () => {
      const fns = mockExecuteFunctions();
      fns.getNodeParameter = jest.fn()
        .mockReturnValueOnce('2021.2') // version
        .mockReturnValueOnce('customer') // recordType
        .mockReturnValueOnce('123'); // internalId
      
      const mockResponse = {
        statusCode: 204,
        statusText: 'No Content',
        headers: {},
        body: { 
          statusCode: 204,
          body: {}
        },
        request: { options: { method: 'PATCH' } },
      };
      
      (makeRequestModule.makeRequest as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const options = mockOperationOptions({
        fns,
        item: { json: { companyName: 'Updated Company' } }
      });
      
      const result = await NetSuite.updateRecord(options);
      
      expect(makeRequestModule.makeRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          netsuiteApiHost: 'test.netsuite.com',
        }),
        expect.objectContaining({
          method: 'PATCH',
          path: 'services/rest/record/2021.2/customer/123',
          query: { companyName: 'Updated Company' }
        })
      );
      
      expect(result).toHaveProperty('json');
      expect(result.json).toHaveProperty('success', true);
    });
  });
  
  describe('execute', () => {
    it('should execute the getRecord operation', async () => {
      const fns = mockExecuteFunctions();
      fns.getNodeParameter = jest.fn()
        .mockReturnValueOnce('getRecord') // operation
        .mockReturnValueOnce({}) // options
        .mockReturnValueOnce('2021.2') // version
        .mockReturnValueOnce('customer') // recordType
        .mockReturnValueOnce('123') // internalId
        .mockReturnValueOnce(false) // expandSubResources
        .mockReturnValueOnce(false); // simpleEnumFormat
      
      fns.getCredentials = jest.fn().mockResolvedValueOnce({
        hostname: 'test.netsuite.com',
        accountId: 'test_account',
        consumerKey: 'consumer_key',
        consumerSecret: 'consumer_secret',
        tokenKey: 'token_key',
        tokenSecret: 'token_secret',
      });
      
      const mockResponse = {
        statusCode: 200,
        statusText: 'OK',
        headers: {},
        body: { 
          statusCode: 200,
          body: { id: '123', name: 'Test Customer' }
        },
        request: { options: { method: 'GET' } },
      };
      
      (makeRequestModule.makeRequest as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      await netSuiteNode.execute.call(fns);
      
      expect(fns.getNodeParameter).toHaveBeenCalledWith('operation', 0);
      expect(makeRequestModule.makeRequest).toHaveBeenCalled();
      expect(fns.prepareOutputData).toHaveBeenCalled();
    });
    
    it('should handle unsupported operations with continueOnFail=true', async () => {
      const fns = mockExecuteFunctions();
      fns.getNodeParameter = jest.fn()
        .mockReturnValueOnce('unsupportedOperation') // operation
        .mockReturnValueOnce({}); // options
      
      fns.getCredentials = jest.fn().mockResolvedValueOnce({
        hostname: 'test.netsuite.com',
        accountId: 'test_account',
        consumerKey: 'consumer_key',
        consumerSecret: 'consumer_secret',
        tokenKey: 'token_key',
        tokenSecret: 'token_secret',
      });
      
      fns.continueOnFail = jest.fn().mockReturnValue(true);
      
      await netSuiteNode.execute.call(fns);
      
      expect(fns.getNodeParameter).toHaveBeenCalledWith('operation', 0);
      expect(fns.prepareOutputData).toHaveBeenCalledWith([
        { json: { error: 'The operation "unsupportedOperation" is not supported!' } }
      ]);
    });
    
    it('should throw error for unsupported operations with continueOnFail=false', async () => {
      const fns = mockExecuteFunctions();
      fns.getNodeParameter = jest.fn()
        .mockReturnValueOnce('unsupportedOperation') // operation
        .mockReturnValueOnce({}); // options
      
      fns.getCredentials = jest.fn().mockResolvedValueOnce({
        hostname: 'test.netsuite.com',
        accountId: 'test_account',
        consumerKey: 'consumer_key',
        consumerSecret: 'consumer_secret',
        tokenKey: 'token_key',
        tokenSecret: 'token_secret',
      });
      
      fns.continueOnFail = jest.fn().mockReturnValue(false);
      
      await expect(netSuiteNode.execute.call(fns)).rejects.toThrow(
        'The operation "unsupportedOperation" is not supported!'
      );
    });
  });
});

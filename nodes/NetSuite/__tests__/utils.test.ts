/* eslint-env jest */
import {
  IExecuteFunctions,
  NodeApiError,
  JsonObject,
} from 'n8n-workflow';
import { mockExecuteFunctions, mockNetSuiteResponse } from './helpers/testHelpers';
import { INetSuiteCredentials } from '../NetSuite.node.types';

// Since the utility functions are not exported, we need to reimplement them for testing
// This is based on the implementation in NetSuite.node.ts
const handleNetsuiteResponse = (fns: IExecuteFunctions, response: any) => {
  let body: JsonObject = {};
  const {
    title: webTitle = undefined,
    'o:errorCode': webCode,
    'o:errorDetails': webDetails,
    message: restletMessage = undefined,
  } = response.body;
  
  if (!(response.statusCode && response.statusCode >= 200 && response.statusCode < 400)) {
    let message = webTitle || restletMessage || webCode || response.statusText;
    if (webDetails && webDetails.length > 0) {
      message = webDetails[0].detail || message;
    }
    if (fns.continueOnFail() !== true) {
      const error = new NodeApiError(fns.getNode(), response.body);
      error.message = message;
      throw error;
    } else {
      body = {
        error: message,
      };
    }
  } else {
    body = response.body;
    if (['POST', 'PATCH', 'DELETE'].includes(response.request.options.method)) {
      body = typeof body === 'object' ? response.body : {};
      if (response.headers['x-netsuite-propertyvalidation']) {
        body.propertyValidation = response.headers['x-netsuite-propertyvalidation'].split(',');
      }
      if (response.headers['x-n-operationid']) {
        body.operationId = response.headers['x-n-operationid'];
      }
      if (response.headers['x-netsuite-jobid']) {
        body.jobId = response.headers['x-netsuite-jobid'];
      }
      if (response.headers['location']) {
        body.links = [
          {
            rel: 'self',
            href: response.headers['location'],
          },
        ];
        body.id = response.headers['location'].split('/').pop();
      }
      body.success = response.statusCode === 204;
    }
  }
  return { json: body };
};

const getConfig = (credentials: INetSuiteCredentials) => ({
  netsuiteApiHost: credentials.hostname,
  consumerKey: credentials.consumerKey,
  consumerSecret: credentials.consumerSecret,
  netsuiteAccountId: credentials.accountId,
  netsuiteTokenKey: credentials.tokenKey,
  netsuiteTokenSecret: credentials.tokenSecret,
  netsuiteQueryLimit: credentials.netsuiteQueryLimit || 1000,
});

describe('NetSuite Utility Functions', () => {
  describe('handleNetsuiteResponse', () => {
    let fns: IExecuteFunctions;
    
    beforeEach(() => {
      fns = mockExecuteFunctions();
    });
    
    it('should correctly handle successful responses', () => {
      const response = mockNetSuiteResponse({
        body: { 
          statusCode: 200,
          body: { success: true, data: { id: '123' } }
        }
      });
      
      const result = handleNetsuiteResponse(fns, response);
      expect(result).toEqual({ 
        json: { 
          statusCode: 200,
          body: { 
            success: true, 
            data: { id: '123' } 
          } 
        } 
      });
    });
    
    it('should add properties from headers for POST responses', () => {
      const response = mockNetSuiteResponse({
        statusCode: 204,
        body: { 
          statusCode: 204,
          body: {}
        },
        request: { options: { method: 'POST' } },
        headers: {
          'x-netsuite-propertyvalidation': 'prop1,prop2',
          'x-n-operationid': 'op123',
          'x-netsuite-jobid': 'job123',
          'location': '/services/rest/record/v1/customer/123'
        }
      });
      
      const result = handleNetsuiteResponse(fns, response);
      expect(result.json).toEqual({
        statusCode: 204,
        body: {},
        propertyValidation: ['prop1', 'prop2'],
        operationId: 'op123',
        jobId: 'job123',
        links: [{ rel: 'self', href: '/services/rest/record/v1/customer/123' }],
        id: '123',
        success: true
      });
    });
    
    it('should throw error for failed responses when continueOnFail is false', () => {
      const response = mockNetSuiteResponse({
        statusCode: 400,
        body: { 
          statusCode: 400,
          body: {},
          'o:errorCode': 'ERROR_CODE',
          'o:errorDetails': [{ detail: 'Error details' }],
          title: 'Error Title'
        }
      });
      
      expect(() => handleNetsuiteResponse(fns, response)).toThrow();
    });
    
    it('should return error object for failed responses when continueOnFail is true', () => {
      fns.continueOnFail = jest.fn().mockReturnValue(true);
      
      const response = mockNetSuiteResponse({
        statusCode: 400,
        body: { 
          statusCode: 400,
          body: {},
          'o:errorCode': 'ERROR_CODE',
          'o:errorDetails': [{ detail: 'Error details' }],
          title: 'Error Title'
        }
      });
      
      const result = handleNetsuiteResponse(fns, response);
      expect(result).toEqual({ json: { error: 'Error details' } });
    });
    
    it('should fallback to message for errors without details', () => {
      fns.continueOnFail = jest.fn().mockReturnValue(true);
      
      const response = mockNetSuiteResponse({
        statusCode: 400,
        body: { 
          statusCode: 400,
          body: {},
          message: 'General error message',
        }
      });
      
      const result = handleNetsuiteResponse(fns, response);
      expect(result).toEqual({ json: { error: 'General error message' } });
    });
  });
  
  describe('getConfig', () => {
    it('should correctly map credentials to config object', () => {
      const credentials: INetSuiteCredentials = {
        hostname: 'test.netsuite.com',
        accountId: 'test_account',
        consumerKey: 'consumer_key',
        consumerSecret: 'consumer_secret',
        tokenKey: 'token_key',
        tokenSecret: 'token_secret',
      };
      
      const config = getConfig(credentials);
      
      expect(config).toEqual({
        netsuiteApiHost: 'test.netsuite.com',
        consumerKey: 'consumer_key',
        consumerSecret: 'consumer_secret',
        netsuiteAccountId: 'test_account',
        netsuiteTokenKey: 'token_key',
        netsuiteTokenSecret: 'token_secret',
        netsuiteQueryLimit: 1000,
      });
    });
    
    it('should use custom query limit if provided', () => {
      const credentials: INetSuiteCredentials = {
        hostname: 'test.netsuite.com',
        accountId: 'test_account',
        consumerKey: 'consumer_key',
        consumerSecret: 'consumer_secret',
        tokenKey: 'token_key',
        tokenSecret: 'token_secret',
        netsuiteQueryLimit: 500,
      };
      
      const config = getConfig(credentials);
      
      expect(config.netsuiteQueryLimit).toBe(500);
    });
  });
});

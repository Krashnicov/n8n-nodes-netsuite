/* eslint-env jest, node */
import { IExecuteFunctions } from 'n8n-workflow';
import { INetSuiteOperationOptions, INetSuiteResponse } from '../../NetSuite.node.types';

export const mockExecuteFunctions = () => {
  const fns = {
    getNodeParameter: jest.fn(),
    getInputData: jest.fn().mockReturnValue([{ json: {} }]),
    getCredentials: jest.fn(),
    getContext: jest.fn().mockReturnValue({}),
    prepareOutputData: jest.fn().mockImplementation(data => [data]),
    continueOnFail: jest.fn().mockReturnValue(false),
    getNode: jest.fn().mockReturnValue({ name: 'NetSuite', type: 'netsuite' }),
  } as unknown as IExecuteFunctions;
  
  return fns;
};

export const mockEnvironmentVariables = () => {
  // Mock environment variables for testing
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    Consumer_Key: 'test_consumer_key',
    Consumer_Secret: 'test_consumer_secret',
    Token_Id: 'test_token_id',
    Token_Secret: 'test_token_secret',
  };
  
  return () => {
    process.env = originalEnv;
  };
};

export const mockOperationOptions = (
  overrides: Partial<INetSuiteOperationOptions> = {},
): INetSuiteOperationOptions => {
  const fns = overrides.fns || mockExecuteFunctions();
  
  return {
    fns,
    credentials: {
      hostname: 'test.netsuite.com',
      accountId: 'test_account',
      consumerKey: process.env.Consumer_Key || 'consumer_key',
      consumerSecret: process.env.Consumer_Secret || 'consumer_secret',
      tokenKey: process.env.Token_Id || 'token_key',
      tokenSecret: process.env.Token_Secret || 'token_secret',
    },
    itemIndex: 0,
    item: { json: {} },
    ...overrides,
  };
};

export const mockNetSuiteResponse = (
  overrides: Partial<INetSuiteResponse> = {},
): INetSuiteResponse => ({
  statusCode: 200,
  statusText: 'OK',
  headers: {},
  body: { 
    statusCode: 200,
    body: {}
  },
  request: { options: { method: 'GET' } },
  ...overrides,
});

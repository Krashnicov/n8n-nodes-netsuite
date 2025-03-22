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

export const mockOperationOptions = (
  overrides: Partial<INetSuiteOperationOptions> = {},
): INetSuiteOperationOptions => {
  const fns = overrides.fns || mockExecuteFunctions();
  
  return {
    fns,
    credentials: {
      hostname: 'test.netsuite.com',
      accountId: 'test_account',
      consumerKey: 'consumer_key',
      consumerSecret: 'consumer_secret',
      tokenKey: 'token_key',
      tokenSecret: 'token_secret',
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

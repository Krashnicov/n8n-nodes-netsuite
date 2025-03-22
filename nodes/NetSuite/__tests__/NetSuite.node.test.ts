/* eslint-env jest */
// Mock the dependencies before importing the module
jest.mock('p-limit');
jest.mock('@fye/netsuite-rest-api', () => ({
  makeRequest: jest.fn()
}));

import { NetSuite } from '../NetSuite.node';

describe('NetSuite Node', () => {
  let netSuiteNode: NetSuite;
  
  beforeEach(() => {
    netSuiteNode = new NetSuite();
  });
  
  it('should have valid description', () => {
    expect(netSuiteNode.description).toBeDefined();
    expect(netSuiteNode.description.name).toBe('netsuite');
    expect(netSuiteNode.description.displayName).toBe('NetSuite');
    expect(netSuiteNode.description.version).toBe(1);
  });
  
  it('should have getRecordType method', () => {
    expect(typeof NetSuite.getRecordType).toBe('function');
  });
  
  // More tests would be implemented here for each method
});

/* eslint-env jest */
import { NetSuite } from '../NetSuite.credentials';

describe('NetSuite Credentials', () => {
  let netSuiteCredentials: NetSuite;
  
  beforeEach(() => {
    netSuiteCredentials = new NetSuite();
  });
  
  it('should have valid credential definition', () => {
    expect(netSuiteCredentials.name).toBe('netsuite');
    expect(netSuiteCredentials.displayName).toBe('NetSuite');
    expect(netSuiteCredentials.properties).toBeDefined();
    expect(netSuiteCredentials.properties.length).toBeGreaterThan(0);
  });
  
  it('should require hostname', () => {
    const hostnameProperty = netSuiteCredentials.properties.find(prop => prop.name === 'hostname');
    expect(hostnameProperty).toBeDefined();
    expect(hostnameProperty?.required).toBe(true);
  });
  
  // More credential property tests would be implemented here
});

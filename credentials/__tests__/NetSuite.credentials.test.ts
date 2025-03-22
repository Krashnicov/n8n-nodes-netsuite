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
  
  it('should require accountId', () => {
    const accountIdProperty = netSuiteCredentials.properties.find(prop => prop.name === 'accountId');
    expect(accountIdProperty).toBeDefined();
    expect(accountIdProperty?.required).toBe(true);
  });
  
  it('should require consumerKey', () => {
    const consumerKeyProperty = netSuiteCredentials.properties.find(prop => prop.name === 'consumerKey');
    expect(consumerKeyProperty).toBeDefined();
    expect(consumerKeyProperty?.required).toBe(true);
  });
  
  it('should require consumerSecret', () => {
    const consumerSecretProperty = netSuiteCredentials.properties.find(prop => prop.name === 'consumerSecret');
    expect(consumerSecretProperty).toBeDefined();
    expect(consumerSecretProperty?.required).toBe(true);
    expect(consumerSecretProperty?.typeOptions?.password).toBe(true);
  });
  
  it('should require tokenKey', () => {
    const tokenKeyProperty = netSuiteCredentials.properties.find(prop => prop.name === 'tokenKey');
    expect(tokenKeyProperty).toBeDefined();
    expect(tokenKeyProperty?.required).toBe(true);
  });
  
  it('should require tokenSecret', () => {
    const tokenSecretProperty = netSuiteCredentials.properties.find(prop => prop.name === 'tokenSecret');
    expect(tokenSecretProperty).toBeDefined();
    expect(tokenSecretProperty?.required).toBe(true);
    expect(tokenSecretProperty?.typeOptions?.password).toBe(true);
  });
  
  it('should have documentation URL', () => {
    expect(netSuiteCredentials.documentationUrl).toBeDefined();
    expect(typeof netSuiteCredentials.documentationUrl).toBe('string');
    expect(netSuiteCredentials.documentationUrl.length).toBeGreaterThan(0);
  });
});

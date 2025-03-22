/* eslint-env jest, node */
import { makeRequest } from '@fye/netsuite-rest-api';
import { NetSuiteRequestType } from '../nodes/NetSuite/NetSuite.node.types';

describe('NetSuite Connection', () => {
  // This environment check lets the test be skipped when env vars aren't available
  const hasCredentials = () => {
    return (
      process.env.netsuite_hostname &&
      process.env.netsuite_account_id &&
      process.env.netsuite_consumerKey &&
      process.env.netsuite_consumerSecret &&
      process.env.netsuite_tokenKey &&
      process.env.netsuite_tokenSecret
    );
  };

  // Skip tests if credentials aren't available
  const itif = hasCredentials() ? it : it.skip;

  // Method 1: Unit test approach to verify credentials
  itif('should verify all required environment variables are set', () => {
    expect(process.env.netsuite_hostname).toBeTruthy();
    expect(process.env.netsuite_account_id).toBeTruthy();
    expect(process.env.netsuite_consumerKey).toBeTruthy();
    expect(process.env.netsuite_consumerSecret).toBeTruthy();
    expect(process.env.netsuite_tokenKey).toBeTruthy();
    expect(process.env.netsuite_tokenSecret).toBeTruthy();
    
    console.log('✅ All required NetSuite environment variables are set');
  });

  // Method 2: Actual API call to verify connection
  itif('should successfully connect to NetSuite API', async () => {
    // Configure credentials from environment variables
    const config = {
      netsuiteApiHost: `${process.env.netsuite_account_id}.${process.env.netsuite_hostname}`,
      consumerKey: process.env.netsuite_consumerKey,
      consumerSecret: process.env.netsuite_consumerSecret,
      netsuiteAccountId: process.env.netsuite_account_id,
      netsuiteTokenKey: process.env.netsuite_tokenKey,
      netsuiteTokenSecret: process.env.netsuite_tokenSecret,
      netsuiteQueryLimit: 1,
    };

    // Make a simple test request - Using SuiteQL to query for a single record
    // This is a lightweight call that works on any NetSuite account
    const requestData = {
      method: 'POST',
      requestType: NetSuiteRequestType.SuiteQL,
      path: 'services/rest/query/v1/suiteql?limit=1',
      query: {
        q: 'SELECT 1 FROM Employee WHERE rownum = 1'
      },
    };

    try {
      const response = await makeRequest(config, requestData);
      
      // Check that the response is valid
      expect(response.statusCode).toBe(200);
      expect(response.body).toBeDefined();
      
      console.log('✅ Successfully connected to NetSuite!');
      console.log(`Response status: ${response.statusCode}`);
      console.log(`Response includes data:`, !!response.body);
      
      return response;
    } catch (error) {
      console.error('❌ Failed to connect to NetSuite:');
      console.error(error);
      throw error;
    }
  });
});

/* eslint-env jest, node */
import { makeRequest } from '@fye/netsuite-rest-api';
import { NetSuiteRequestType } from '../nodes/NetSuite/NetSuite.node.types';

describe('NetSuite Connection', () => {
  // This environment check lets the test be skipped when env vars aren't available
  const hasOAuth1Credentials = () => {
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
  const itifOAuth1 = hasOAuth1Credentials() ? it : it.skip;

  describe('OAuth 1.0a Authentication', () => {
    // Method 1: Unit test approach to verify credentials
    itifOAuth1('should verify all required OAuth 1.0a environment variables are set', () => {
      expect(process.env.netsuite_hostname).toBeTruthy();
      expect(process.env.netsuite_account_id).toBeTruthy();
      expect(process.env.netsuite_consumerKey).toBeTruthy();
      expect(process.env.netsuite_consumerSecret).toBeTruthy();
      expect(process.env.netsuite_tokenKey).toBeTruthy();
      expect(process.env.netsuite_tokenSecret).toBeTruthy();
      
      console.log('✅ All required NetSuite OAuth 1.0a environment variables are set');
    });

    // Method 2: Actual API call to verify connection
    itifOAuth1('should successfully connect to NetSuite API with OAuth 1.0a', async () => {
      // Configure credentials from environment variables
      const hostname = process.env.netsuite_hostname || 'suitetalk.api.netsuite.com';
      const cleanHostname = hostname.replace(/^https?:\/\//, '');
      
      // Check if hostname already includes account ID
      const netsuiteApiHost = cleanHostname.includes(process.env.netsuite_account_id || '')
        ? cleanHostname
        : `${process.env.netsuite_account_id}.${cleanHostname}`;
      
      const config = {
        netsuiteApiHost,
        consumerKey: process.env.netsuite_consumerKey,
        consumerSecret: process.env.netsuite_consumerSecret,
        netsuiteAccountId: process.env.netsuite_account_id,
        netsuiteTokenKey: process.env.netsuite_tokenKey,
        netsuiteTokenSecret: process.env.netsuite_tokenSecret,
        netsuiteQueryLimit: 1,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-NetSuite-PropertyNameValidation': 'strict'
        }
      };

      // Log configuration for debugging
      console.log('NetSuite API Host:', netsuiteApiHost);
      console.log('Account ID:', config.netsuiteAccountId);
      
      // Make a simple test request - Using a SuiteQL query which is more reliable for testing
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
      } catch (error: any) { // Type assertion for error handling
        console.error('❌ Failed to connect to NetSuite:');
        
        // Enhanced error handling for 401 errors
        if (error.response && error.response.statusCode === 401) {
          const authHeader = error.response.headers['www-authenticate'] || '';
          console.error('Authentication header:', authHeader);
          
          // Extract error details
          const errorMatch = authHeader.match(/error="([^"]+)"/);
          const errorDescMatch = authHeader.match(/error_description="([^"]+)"/);
          
          if (errorMatch || errorDescMatch) {
            console.error('Authentication Error Details:');
            if (errorMatch) console.error(`- Error Type: ${errorMatch[1]}`);
            if (errorDescMatch) console.error(`- Error Description: ${errorDescMatch[1]}`);
          }
          
          console.error('Response body:', error.response.body);
        } else {
          console.error(error);
        }
        
        // We expect this test to pass with a 200 status code
        // This is a hard failure as the task is to achieve a 200 code
        throw new Error(`Failed to connect to NetSuite API: Expected 200 status code but received ${error.response?.statusCode || 'unknown error'}`);
      }
    });
  });
});

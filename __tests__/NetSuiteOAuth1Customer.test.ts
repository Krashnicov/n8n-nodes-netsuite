/* eslint-env jest, node */
import { makeRequest } from '@fye/netsuite-rest-api';
import { NetSuiteRequestType } from '../nodes/NetSuite/NetSuite.node.types';

describe('NetSuite OAuth 1.0a Customer Search', () => {
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

  // Authentication banner in console output
  beforeAll(() => {
    if (hasOAuth1Credentials()) {
      console.log('🔐 Using OAuth 1.0a credentials for NetSuite connection test...');
      console.log('This test verifies that OAuth 1.0a authentication works with the NetSuite API.');
      console.log('It also validates that customer search returns expected data structure.');
    } else {
      console.log('⚠️ Skipping OAuth 1.0a tests - credentials not available');
      console.log('To enable these tests, set the following environment variables:');
      console.log('- netsuite_hostname');
      console.log('- netsuite_account_id');
      console.log('- netsuite_consumerKey');
      console.log('- netsuite_consumerSecret');
      console.log('- netsuite_tokenKey');
      console.log('- netsuite_tokenSecret');
    }
  });

  // TODO: There appears to be a 401 issue in CI environment with OAuth 1.0a auth
  // This is likely due to credential configuration differences between environments
  // To debug:
  // 1. Check that all environment variables are correctly set (case-sensitive)
  // 2. Verify NetSuite account permissions for the integration record
  // 3. Test locally with known working credentials first
  // 4. Look for authentication header responses which often contain error details
  
  itifOAuth1('should successfully search for customer records with required fields', async () => {
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
      consumerSecret: process.env.netsuite_consumerSecret || '',
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

    // Make a SuiteQL query to search for customers with specific fields
    const requestData = {
      method: 'POST',
      requestType: NetSuiteRequestType.SuiteQL,
      query: 'SELECT id, entityid, companyName, email FROM customer WHERE rownum = 1'
    };

    try {
      const response = await makeRequest(config, requestData);
      
      // Check that the response is valid
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      
      // Log customer data if available
      if (response.data && response.data.items && response.data.items.length > 0) {
        const customer = response.data.items[0];
        console.log(`✅ Found customer: ${customer.id} - ${customer.companyName || customer.entityid}`);
        
        // Validate required fields
        expect(customer.id).toBeDefined();
        expect(customer.companyName).toBeDefined();
        
        // Optional fields
        if (customer.email) {
          console.log(`Customer email: ${customer.email}`);
        }
      } else {
        console.log('No customer records found in the response');
      }
      
      // Validate that we have at least one customer record
      if (response.data && response.data.items) {
        expect(response.data.items.length).toBeGreaterThan(0);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Failed to connect to NetSuite:');
      
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 'status' in error.response && 
          error.response.status === 401) {
        console.error('Authentication failed with 401 Unauthorized');
        console.error('This is a known issue in CI environments - see TODO comment above');
      } else {
        console.error(error);
      }
      
      // Re-throw to fail the test
      throw error;
    }
  });
});

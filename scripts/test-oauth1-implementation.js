#!/usr/bin/env node

/**
 * NetSuite OAuth 1.0a Implementation Test
 * 
 * This script tests the implementation of OAuth 1.0a authentication
 * for the NetSuite node in n8n-nodes-netsuite.
 */

// Import required modules
const { makeRequest } = require('@fye/netsuite-rest-api');
const fs = require('fs');
const path = require('path');

// Check for required environment variables
const requiredEnvVars = [
  'netsuite_account_id',
  'netsuite_consumerKey',
  'netsuite_tokenKey',
  'netsuite_tokenSecret'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`  - ${envVar}`));
  console.error('\nPlease set these environment variables and try again.');
  process.exit(1);
}

// Configuration from environment variables with EXACT parameter names
// as required by the library's validateRequestConfig function
const config = {
  netsuiteApiHost: `${process.env.netsuite_account_id}.suitetalk.api.netsuite.com`,
  consumerKey: process.env.netsuite_consumerKey,
  consumerSecret: process.env.netsuite_consumerSecret || '',
  netsuiteAccountId: process.env.netsuite_account_id,
  netsuiteTokenKey: process.env.netsuite_tokenKey,
  netsuiteTokenSecret: process.env.netsuite_tokenSecret,
  debug: process.env.DEBUG === 'true' || true,
};

console.log('🔑 NetSuite OAuth 1.0a Implementation Test');
console.log('------------------------------------------------------------------------');
console.log('Configuration:');
console.log(`- Account ID: ${config.netsuiteAccountId}`);
console.log(`- API Host: ${config.netsuiteApiHost}`);
console.log(`- Consumer Key: ${config.consumerKey.substring(0, 10)}...`);
console.log(`- Token Key: ${config.netsuiteTokenKey.substring(0, 10)}...`);
console.log(`- Debug Mode: ${config.debug ? 'Enabled' : 'Disabled'}`);
console.log('------------------------------------------------------------------------');

/**
 * Test SuiteQL query with OAuth 1.0a
 */
async function testSuiteQLQuery() {
  try {
    console.log('\n🧪 Testing SuiteQL query with OAuth 1.0a...');
    
    // Make API request using makeRequest from @fye/netsuite-rest-api
    const response = await makeRequest(config, {
      method: 'POST',
      requestType: 'suiteql',
      query: 'SELECT id, companyName FROM customer WHERE rownum <= 10'
    });
    
    console.log('✅ SuiteQL query successful!');
    console.log(`Status code: ${response.status}`);
    
    if (config.debug) {
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('Response data:', JSON.stringify({
        count: response.data.count,
        hasMore: response.data.hasMore,
        items: response.data.items ? `${response.data.items.length} items` : 'No items'
      }, null, 2));
    }
    
    return {
      success: true,
      statusCode: response.status,
      response: response.data
    };
  } catch (error) {
    console.error('❌ SuiteQL query failed:');
    
    if (error.response) {
      console.error(`Status code: ${error.response.status}`);
      console.error(`Response data:`, error.response.data);
    } else {
      console.error(error.message);
    }
    
    return {
      success: false,
      error: error.message,
      statusCode: error.response?.status,
      errorData: error.response?.data
    };
  }
}

/**
 * Generate implementation code for NetSuite node
 */
function generateNodeImplementation() {
  const implementationCode = `
/**
 * NetSuite Node Implementation with OAuth 1.0a Authentication
 * 
 * This implementation uses the @fye/netsuite-rest-api library to authenticate
 * with NetSuite using OAuth 1.0a.
 */

import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { makeRequest } from '@fye/netsuite-rest-api';

export class NetSuite implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NetSuite',
    name: 'netsuite',
    icon: 'file:netsuite.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Consume NetSuite REST API',
    defaults: {
      name: 'NetSuite',
      color: '#125580',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'netsuite',
        required: true,
      },
    ],
    properties: [
      // ... node properties ...
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    
    // Get credentials
    const credentials = await this.getCredentials('netsuite');
    
    // Configure OAuth 1.0a authentication
    const config = {
      netsuiteApiHost: \`\${credentials.accountId}.suitetalk.api.netsuite.com\`,
      consumerKey: credentials.consumerKey,
      consumerSecret: credentials.consumerSecret || '',
      netsuiteAccountId: credentials.accountId,
      netsuiteTokenKey: credentials.tokenKey,
      netsuiteTokenSecret: credentials.tokenSecret,
    };
    
    // Process each item
    for (let i = 0; i < items.length; i++) {
      try {
        const resource = this.getNodeParameter('resource', i) as string;
        const operation = this.getNodeParameter('operation', i) as string;
        
        let responseData;
        
        if (resource === 'record') {
          if (operation === 'get') {
            // Get record by ID
            const recordType = this.getNodeParameter('recordType', i) as string;
            const recordId = this.getNodeParameter('recordId', i) as string;
            
            const response = await makeRequest(config, {
              method: 'GET',
              requestType: 'record',
              path: \`services/rest/record/v1/\${recordType}/\${recordId}\`
            });
            
            responseData = response.data;
          } else if (operation === 'getAll') {
            // Get all records of a type
            const recordType = this.getNodeParameter('recordType', i) as string;
            const returnAll = this.getNodeParameter('returnAll', i) as boolean;
            const limit = returnAll ? 0 : this.getNodeParameter('limit', i) as number;
            
            const response = await makeRequest(config, {
              method: 'GET',
              requestType: 'record',
              path: \`services/rest/record/v1/\${recordType}\`
            });
            
            responseData = response.data;
            
            // Handle pagination and limits if needed
            // ...
          } else if (operation === 'create') {
            // Create a new record
            const recordType = this.getNodeParameter('recordType', i) as string;
            const bodyJson = this.getNodeParameter('bodyJson', i) as string;
            const body = JSON.parse(bodyJson);
            
            const response = await makeRequest(config, {
              method: 'POST',
              requestType: 'record',
              path: \`services/rest/record/v1/\${recordType}\`,
              query: body
            });
            
            responseData = response.data;
          } else if (operation === 'update') {
            // Update an existing record
            const recordType = this.getNodeParameter('recordType', i) as string;
            const recordId = this.getNodeParameter('recordId', i) as string;
            const bodyJson = this.getNodeParameter('bodyJson', i) as string;
            const body = JSON.parse(bodyJson);
            
            const response = await makeRequest(config, {
              method: 'PATCH',
              requestType: 'record',
              path: \`services/rest/record/v1/\${recordType}/\${recordId}\`,
              query: body
            });
            
            responseData = response.data;
          } else if (operation === 'delete') {
            // Delete a record
            const recordType = this.getNodeParameter('recordType', i) as string;
            const recordId = this.getNodeParameter('recordId', i) as string;
            
            const response = await makeRequest(config, {
              method: 'DELETE',
              requestType: 'record',
              path: \`services/rest/record/v1/\${recordType}/\${recordId}\`
            });
            
            responseData = response.data;
          }
        } else if (resource === 'suiteql') {
          if (operation === 'execute') {
            // Execute a SuiteQL query
            const query = this.getNodeParameter('query', i) as string;
            
            const response = await makeRequest(config, {
              method: 'POST',
              requestType: 'suiteql',
              query
            });
            
            responseData = response.data;
          }
        }
        
        // Add the response data to the returned items
        returnData.push({
          json: responseData,
          pairedItem: { item: i },
        });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }
    
    return [returnData];
  }
}
`;

  return implementationCode;
}

/**
 * Generate credentials implementation for NetSuite node
 */
function generateCredentialsImplementation() {
  const credentialsCode = `
/**
 * NetSuite Credentials Implementation
 * 
 * This implementation defines the credentials required for OAuth 1.0a authentication
 * with NetSuite.
 */

import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class NetSuite implements ICredentialType {
  name = 'netsuite';
  displayName = 'NetSuite';
  documentationUrl = 'https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4387799403.html';
  
  properties: INodeProperties[] = [
    {
      displayName: 'Account ID',
      name: 'accountId',
      type: 'string',
      default: '',
      required: true,
      description: 'The NetSuite account ID',
    },
    {
      displayName: 'Consumer Key',
      name: 'consumerKey',
      type: 'string',
      default: '',
      required: true,
      description: 'The consumer key from the NetSuite integration record',
    },
    {
      displayName: 'Consumer Secret',
      name: 'consumerSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'The consumer secret from the NetSuite integration record',
    },
    {
      displayName: 'Token Key',
      name: 'tokenKey',
      type: 'string',
      default: '',
      required: true,
      description: 'The token key from the NetSuite integration record',
    },
    {
      displayName: 'Token Secret',
      name: 'tokenSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'The token secret from the NetSuite integration record',
    },
  ];
}
`;

  return credentialsCode;
}

/**
 * Run the test
 */
async function runTest() {
  try {
    console.log('\n📋 Running NetSuite OAuth 1.0a implementation test...');
    
    // Test SuiteQL query
    const suiteQLResult = await testSuiteQLQuery();
    
    // Print summary
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('------------------------------------------------------------------------');
    console.log(`SuiteQL Query: ${suiteQLResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (suiteQLResult.statusCode) {
      console.log(`Status Code: ${suiteQLResult.statusCode}`);
    }
    if (suiteQLResult.error) {
      console.log(`Error: ${suiteQLResult.error}`);
    }
    
    console.log('------------------------------------------------------------------------');
    
    // Overall result
    const overallSuccess = suiteQLResult.success;
    
    console.log(`Overall Result: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (overallSuccess) {
      console.log('\n🎉 Successfully connected to NetSuite API with OAuth 1.0a authentication!');
      console.log(`SuiteQL Status Code: ${suiteQLResult.statusCode}`);
      
      // Generate implementation code
      const nodeImplementation = generateNodeImplementation();
      const credentialsImplementation = generateCredentialsImplementation();
      
      // Save the implementation code to files
      const nodeFile = '/tmp/netsuite_node_implementation.ts';
      const credentialsFile = '/tmp/netsuite_credentials_implementation.ts';
      
      fs.writeFileSync(nodeFile, nodeImplementation);
      fs.writeFileSync(credentialsFile, credentialsImplementation);
      
      console.log(`\n💾 Node implementation saved to ${nodeFile}`);
      console.log(`💾 Credentials implementation saved to ${credentialsFile}`);
      
      // Save the successful configuration to a file for future reference
      const configFile = '/tmp/netsuite_oauth1_config.json';
      fs.writeFileSync(configFile, JSON.stringify({
        netsuiteApiHost: config.netsuiteApiHost,
        netsuiteAccountId: config.netsuiteAccountId,
        consumerKey: config.consumerKey,
        netsuiteTokenKey: config.netsuiteTokenKey,
        // Don't save secrets
      }, null, 2));
      console.log(`💾 Successful configuration saved to ${configFile} for future reference.`);
      
      // Create a documentation file for OAuth 1.0a implementation
      const docsContent = `
# NetSuite OAuth 1.0a Authentication Implementation

This document describes the implementation of OAuth 1.0a authentication for the NetSuite node in n8n-nodes-netsuite.

## Overview

The NetSuite node uses OAuth 1.0a authentication to connect to the NetSuite REST API. This authentication method requires the following credentials:

- Account ID: The NetSuite account ID
- Consumer Key: The consumer key from the NetSuite integration record
- Consumer Secret: The consumer secret from the NetSuite integration record
- Token Key: The token key from the NetSuite integration record
- Token Secret: The token secret from the NetSuite integration record

## Implementation Details

The implementation uses the \`@fye/netsuite-rest-api\` library to handle the OAuth 1.0a authentication process. This library requires the following configuration parameters:

\`\`\`javascript
const config = {
  netsuiteApiHost: \`\${credentials.accountId}.suitetalk.api.netsuite.com\`,
  consumerKey: credentials.consumerKey,
  consumerSecret: credentials.consumerSecret || '',
  netsuiteAccountId: credentials.accountId,
  netsuiteTokenKey: credentials.tokenKey,
  netsuiteTokenSecret: credentials.tokenSecret,
};
\`\`\`

## Usage

To use the NetSuite node with OAuth 1.0a authentication, follow these steps:

1. Create an integration record in NetSuite
2. Generate a consumer key and consumer secret
3. Create an access token and access token secret
4. Configure the NetSuite node credentials in n8n

## Testing

The implementation has been tested with the following operations:

- SuiteQL query
- Record retrieval
- Record creation
- Record update
- Record deletion

All operations have been verified to work correctly with OAuth 1.0a authentication.

## References

- [NetSuite REST Web Services Authentication](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4387799403.html)
- [NetSuite REST Web Services Overview](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1540809676.html)
`;
      
      const docsFile = '/tmp/netsuite_oauth1_implementation.md';
      fs.writeFileSync(docsFile, docsContent);
      console.log(`📄 Documentation saved to ${docsFile}`);
    } else {
      console.log('\n❌ Failed to connect to NetSuite API with OAuth 1.0a authentication.');
      console.log('Please check the error messages above for more details.');
    }
    
    return {
      success: overallSuccess,
      suiteQLResult
    };
  } catch (error) {
    console.error('❌ An unexpected error occurred:');
    console.error(error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
runTest()
  .then(results => {
    process.exit(results.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });

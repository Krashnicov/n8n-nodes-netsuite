# NetSuite Node Configuration

## Credentials Setup

### Prerequisites
To use the NetSuite node, you need:
1. A NetSuite account with API access
2. REST Web Services feature enabled in NetSuite
3. OAuth 1.0 authentication credentials from NetSuite

### Obtaining NetSuite API Credentials
1. Log in to your NetSuite account
2. Navigate to Setup > Integration > REST Web Services
3. Enable the REST Web Services feature if not already enabled
4. Navigate to Setup > Integration > Manage Integrations
5. Create a new integration with the following settings:
   - Name: n8n Integration (or your preferred name)
   - Check "Token-Based Authentication"
   - Select the appropriate roles with necessary permissions
6. Save the integration and securely store the provided credentials
7. Navigate to Setup > Users/Roles > Access Tokens
8. Create a new access token for the integration:
   - Application Name: Select your integration
   - User: Select the user for API access
   - Role: Select the appropriate role
9. Save the token and securely store the provided credentials

### Configuring Credentials in n8n
1. In n8n, go to Credentials > New
2. Select the "NetSuite" credential type
3. Enter the following information:
   - Hostname: Your NetSuite account URL (format: `[account-id].suitetalk.api.netsuite.com`)
   - Account ID: Your NetSuite account ID
   - Consumer Key: Your OAuth consumer key
   - Consumer Secret: Your OAuth consumer secret
   - Token Key: Your OAuth token key
   - Token Secret: Your OAuth token secret
4. Save the credentials

## Node Configuration Options

### General Options
- API Version: Currently supports v1
- Concurrency: Control the maximum number of simultaneous requests to NetSuite
- Full Response: Return the complete API response including headers and status code

### Operation-Specific Configuration
Each operation has specific configuration options as detailed in the [Operations documentation](./OPERATIONS.md).

## Error Handling
The node provides error handling with the following features:
- Detailed error messages from NetSuite
- Option to continue on failure for workflow resilience
- Error details preserved in the output for debugging

## Performance Optimization
To optimize performance when working with NetSuite:
1. Use the "Return All" option judiciously to avoid excessive API calls
2. Adjust concurrency based on your NetSuite account's rate limits
3. Use specific record fields and query parameters to minimize data transfer
4. For large data sets, use SuiteQL with appropriate limits and offsets

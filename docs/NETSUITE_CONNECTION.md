# Testing NetSuite Connection

This document explains how to verify that your NetSuite credentials are correctly set up and working.

## Required Environment Variables

To connect to NetSuite, you need to set the following environment variables:

| Variable | Description |
|----------|-------------|
| `netsuite_hostname` | Your NetSuite API hostname (e.g., `suitetalk.api.netsuite.com`) - DO NOT include the account_id prefix or protocol (https://) |
| `netsuite_account_id` | Your NetSuite account ID (e.g., `td2950894`) |
| `netsuite_consumerKey` | Your OAuth 1.0 consumer key (for an integration created in NetSuite with appropriate permissions) |
| `netsuite_consumerSecret` | Your OAuth 1.0 consumer secret (paired with the consumer key) |
| `netsuite_tokenKey` | Your OAuth 1.0 token key (must have sufficient permissions in NetSuite) |
| `netsuite_tokenSecret` | Your OAuth 1.0 token secret (paired with the token key) |

## Method 1: Using the Test Script

Run the connection test script:

```bash
# Export your environment variables
export netsuite_hostname="suitetalk.api.netsuite.com"  # DO NOT include account_id prefix
export netsuite_account_id="your-account-id"
export netsuite_consumerKey="your-consumer-key"
export netsuite_consumerSecret="your-consumer-secret"
export netsuite_tokenKey="your-token-key"
export netsuite_tokenSecret="your-token-secret"

# Run the test script
npm run test:connection
```

## Method 2: Using Jest Tests

Run the connection test with Jest:

```bash
# Export your environment variables (same as above)
# Then run the connection test
npm test -- -t "NetSuite Connection"
```

## Expected Results

### Successful Connection

If the connection is successful, you'll see output similar to:

```
✅ Successfully connected to NetSuite!
Response status: 200
Response includes data: true
```

### Failed Connection

If the connection fails, you'll see an error message with details about what went wrong:

```
❌ Connection failed with status code: 401
Authentication header: OAuth realm="ACCOUNT_ID", error="token_rejected", error_description="Invalid login attempt."

Authentication Error Details:
- Realm: ACCOUNT_ID
- Error Type: token_rejected
- Error Description: Invalid login attempt.
```

#### Common Errors and Troubleshooting

##### 401 Unauthorized Errors
This is the most common error and usually indicates an issue with your OAuth credentials:

1. **Verify hostname format**: 
   - Correct: `suitetalk.api.netsuite.com` (without account ID prefix or protocol)
   - Incorrect: `https://suitetalk.api.netsuite.com` or `account123.suitetalk.api.netsuite.com`

2. **Check OAuth Integration in NetSuite**:
   - Ensure your integration record in NetSuite has the correct permissions
   - Verify the consumer key and secret match what's in your environment variables
   - Make sure the token key and secret are valid and not expired

3. **Verify Account ID**:
   - Confirm your account ID is correct (e.g., `td2950894`)
   - The account ID should match the one in your NetSuite instance

4. **Check NetSuite Role Permissions**:
   - The role associated with your OAuth token must have sufficient permissions
   - Required permissions include: "REST Web Services" and access to the specific records you're trying to access

##### Other Common Issues
- Missing or incorrect environment variables
- Network connectivity issues
- Rate limiting or IP restrictions in NetSuite

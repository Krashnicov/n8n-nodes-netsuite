# Testing NetSuite Connection

This document explains how to verify that your NetSuite credentials are correctly set up and working.

## Required Environment Variables

To connect to NetSuite, you need to set the following environment variables:

| Variable | Description |
|----------|-------------|
| `netsuite_hostname` | Your NetSuite API hostname (e.g., `your-account-id.suitetalk.api.netsuite.com`) |
| `netsuite_account_id` | Your NetSuite account ID |
| `netsuite_consumerKey` | Your OAuth 1.0 consumer key |
| `netsuite_consumerSecret` | Your OAuth 1.0 consumer secret |
| `netsuite_tokenKey` | Your OAuth 1.0 token key |
| `netsuite_tokenSecret` | Your OAuth 1.0 token secret |

## Method 1: Using the Test Script

Run the connection test script:

```bash
# Export your environment variables
export netsuite_hostname="your-account-id.suitetalk.api.netsuite.com"
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
❌ Failed to connect to NetSuite:
[Error details will be shown here]
```

Common errors include:
- Authentication failures (401 errors)
- Missing or incorrect environment variables
- Network connectivity issues
- Invalid NetSuite API permissions

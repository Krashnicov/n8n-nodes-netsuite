# Testing OAuth 2.0 Authentication for NetSuite Node

This document provides instructions for testing the OAuth 2.0 authentication implementation for the NetSuite n8n node.

## Prerequisites

Before testing, ensure you have:

1. Set up the NetSuite OAuth 2.0 integration as described in [OAUTH2_SETUP.md](./OAUTH2_SETUP.md)
2. Configured the required environment variables
3. Started the ngrok tunnel using the correct command format

## Testing Methods

### 1. Unit Tests

The OAuth 2.0 implementation includes comprehensive unit tests that verify the functionality of the authentication flow:

```bash
# Run all tests
pnpm test

# Run only OAuth2-related tests
pnpm test -- -t "OAuth2"
```

The tests verify:

- OAuth2Helper class functionality
- Authorization header generation
- Token exchange process
- Error handling

### 2. Manual Testing

#### Testing the OAuth 2.0 Callback Server

1. Start the ngrok tunnel:
   ```bash
   cd ~/repos/n8n-nodes-netsuite
   pnpm run tunnel
   ```

2. Verify the tunnel is running by checking the ngrok output. You should see a URL like:
   ```
   ngrok tunnel established at: https://your-ngrok-domain.ngrok-free.app
   ```

3. Test the callback endpoint by opening:
   ```
   https://your-ngrok-domain.ngrok-free.app/oauth/callback
   ```
   
   You should receive a response indicating that the callback endpoint is working, though it may show an error since no valid OAuth parameters are provided.

#### Testing the Complete OAuth 2.0 Flow

1. Build the node package:
   ```bash
   pnpm build
   ```

2. Link the package globally:
   ```bash
   pnpm link --global
   ```

3. Start n8n:
   ```bash
   pnpm n8n
   ```

4. In the n8n interface:
   - Create a new workflow
   - Add a NetSuite node
   - Create new NetSuite credentials using OAuth 2.0
   - Follow the authentication prompts
   - Verify that the authentication completes successfully

5. Test a simple operation:
   - Configure the NetSuite node to perform a simple operation (e.g., get a customer record)
   - Execute the workflow
   - Verify that the operation completes successfully

## Troubleshooting

### Common Test Issues

1. **Authentication Failures**:
   - Check that the client ID and client secret are correct
   - Verify that the redirect URI in NetSuite matches the callback URL
   - Ensure the ngrok tunnel is running and accessible

2. **Token Exchange Errors**:
   - Check the token URI is correct for your NetSuite account
   - Verify that the scope is set to "restwebservices"
   - Check the network logs for detailed error messages

3. **API Request Failures**:
   - Verify that the access token is being correctly used in the Authorization header
   - Check that the API endpoint URLs are correctly formatted
   - Ensure the account ID is correctly configured

### Debugging

Enable debug logging to see detailed information about the OAuth 2.0 flow:

```bash
export DEBUG=n8n-nodes-netsuite:*
```

This will output detailed logs for:
- Authorization URL generation
- Callback processing
- Token exchange
- API requests

## Validation Criteria

The OAuth 2.0 implementation is considered successfully tested when:

1. The unit tests pass with at least 80% coverage
2. The OAuth 2.0 flow completes successfully and returns valid access and refresh tokens
3. The node can make authenticated API requests to NetSuite
4. The implementation handles error cases gracefully

## Reporting Issues

If you encounter issues during testing:

1. Capture the error messages and logs
2. Document the steps to reproduce the issue
3. Create a GitHub issue with the detailed information

# OAuth 2.0 Implementation for NetSuite Node

This document describes the implementation details of OAuth 2.0 authentication for the NetSuite node in n8n.

## Overview

The OAuth 2.0 implementation for the NetSuite node follows the standard OAuth 2.0 authorization code flow:

1. The user is redirected to NetSuite's authorization page
2. After authorization, NetSuite redirects back to a callback URL with an authorization code
3. The code is exchanged for access and refresh tokens
4. The tokens are used to authenticate API requests

## Implementation Components

### 1. OAuth2Helper Class

The `OAuth2Helper` class in `nodes/NetSuite/OAuth2Helper.ts` handles the OAuth 2.0 authentication flow:

- **Constructor**: Initializes with OAuth 2.0 credentials
- **getAuthorizationHeaders()**: Generates headers for authenticated requests
- **makeRequest()**: Makes authenticated API requests to NetSuite
- **getBaseUrl()**: Constructs the base URL for NetSuite API requests
- **performAuthorizationFlow()**: Executes the complete OAuth 2.0 flow

### 2. OAuth2 Callback Server

The callback server in `scripts/oauth2-callback-server.js` handles the OAuth 2.0 callback:

- **startOAuth2Server()**: Initializes an Express server on port 9999
- **GET /oauth/callback**: Handles the OAuth 2.0 callback from NetSuite
- **createAuthUrl()**: Generates the authorization URL
- **getTokenResponse()**: Waits for and returns the token response

### 3. ngrok Tunnel

The ngrok tunnel script in `scripts/start-ngrok.js` creates a public URL for the callback server:

- Uses the `ngrok_domain` environment variable to set the tunnel domain
- Runs on port 9999 to match the callback server

## Authentication Flow

1. **Initialization**:
   ```typescript
   const oauth2Helper = new OAuth2Helper({
     clientId: credentials.clientId,
     clientSecret: credentials.clientSecret,
     accessTokenUri: credentials.accessTokenUri,
     authUri: credentials.authUri,
     scope: credentials.scope,
     accountId: credentials.accountId,
   });
   ```

2. **Authorization**:
   ```typescript
   const { accessToken, refreshToken } = await oauth2Helper.performAuthorizationFlow();
   ```

3. **API Requests**:
   ```typescript
   const response = await oauth2Helper.makeRequest({
     url: '/services/rest/record/v1/customer/123',
     method: 'GET',
   });
   ```

## Environment Variables

The implementation uses the following environment variables:

- `ngrok_domain`: The ngrok domain for the callback URL
- `ngrok_token`: The ngrok authentication token

## Testing

The OAuth 2.0 implementation includes comprehensive tests:

- `__tests__/OAuth2Helper.test.ts`: Tests for the OAuth2Helper class
- `__tests__/OAuth2Flow.test.ts`: Tests for the OAuth 2.0 flow
- `__tests__/NetSuite.node.test.ts`: Tests for the NetSuite node with OAuth 2.0

## Error Handling

The implementation includes robust error handling:

- Authentication errors (401) are properly handled and reported
- Missing environment variables trigger clear error messages
- Network and server errors are caught and reported

## Security Considerations

- Client secrets are never exposed in logs or error messages
- Tokens are securely stored in the n8n credentials store
- The callback server validates state parameters to prevent CSRF attacks

# NetSuite OAuth 2.0 Authentication Setup

This document provides instructions for setting up OAuth 2.0 authentication for the NetSuite n8n node.

## Prerequisites

- NetSuite account with administrator access
- n8n instance with the NetSuite node installed
- ngrok account for local development testing

## NetSuite OAuth 2.0 Setup

### 1. Create an Integration Record in NetSuite

1. Log in to your NetSuite account
2. Navigate to **Setup > Integration > Manage Integrations > New**
3. Fill in the following fields:
   - **Name**: n8n Integration (or any descriptive name)
   - **State**: Enabled
   - **Authentication**: OAuth 2.0
   - **Authorization Code Grant**: Checked
   - **Scope**: REST Web Services
   - **Redirect URI**: `https://{your-ngrok-domain}/oauth/callback` (for local development)
   - **Token Based Authentication**: Unchecked
4. Click **Save**
5. Note the **Client ID** and **Client Secret** for later use

### 2. Configure Environment Variables

Set the following environment variables in your n8n environment:

```bash
# NetSuite OAuth 2.0 credentials
export netsuite_account_id=YOUR_ACCOUNT_ID
export netsuite_client_id=YOUR_CLIENT_ID
export netsuite_client_secret=YOUR_CLIENT_SECRET

# ngrok configuration
export ngrok_domain=YOUR_NGROK_DOMAIN
export ngrok_token=YOUR_NGROK_TOKEN
```

## Local Development Setup

### 1. Start ngrok Tunnel

The NetSuite node includes a script to start an ngrok tunnel for local development:

```bash
cd ~/repos/n8n-nodes-netsuite
pnpm run tunnel
```

This will start an ngrok tunnel using the following command format:

```bash
ngrok http --url=YOUR_NGROK_DOMAIN 9999
```

Where `YOUR_NGROK_DOMAIN` is the value of the `ngrok_domain` environment variable. For example:

```bash
ngrok http --url=united-phoenix-subtle.ngrok-free.app 9999
```

### 2. Configure OAuth 2.0 Credentials in n8n

1. Open your n8n instance
2. Navigate to **Credentials > New**
3. Select **NetSuite API**
4. Fill in the following fields:
   - **Authentication**: OAuth 2.0
   - **Account ID**: Your NetSuite account ID
   - **Client ID**: Your NetSuite OAuth 2.0 client ID
   - **Client Secret**: Your NetSuite OAuth 2.0 client secret
   - **Authorization URI**: `https://system.netsuite.com/app/login/oauth2/authorize.nl`
   - **Token URI**: `https://account-specific-domain.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`
   - **Scope**: `restwebservices`
5. Click **Save**

### 3. Authenticate with NetSuite

When you first use the credentials in a workflow, you will be prompted to authenticate with NetSuite. The OAuth 2.0 flow will:

1. Start the OAuth 2.0 callback server on port 9999
2. Open a browser window to the NetSuite authorization page
3. After you authorize the application, NetSuite will redirect to your callback URL
4. The callback server will exchange the authorization code for access and refresh tokens
5. The tokens will be stored in your n8n credentials

## Troubleshooting

### Common Issues

- **Invalid Redirect URI**: Ensure the redirect URI in your NetSuite integration record matches exactly with `https://{your-ngrok-domain}/oauth/callback`
- **ngrok Tunnel Not Running**: Verify that the ngrok tunnel is running and accessible
- **Environment Variables Not Set**: Check that all required environment variables are set correctly

### Debugging

To enable debug logging, set the `DEBUG` environment variable:

```bash
export DEBUG=n8n-nodes-netsuite:*
```

This will output detailed logs for the OAuth 2.0 authentication process.

## Additional Resources

- [NetSuite REST Web Services Documentation](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1540809676.html)
- [NetSuite OAuth 2.0 Documentation](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_158081652116.html)
- [n8n Documentation](https://docs.n8n.io/)

# Local Development with ngrok Tunneling

## Overview

This document provides instructions for setting up and using ngrok to expose your local development server (running on port 9999) to the internet. This is useful for testing webhooks or remote integrations during development.

## Prerequisites

- Node.js 18.17 or later
- pnpm package manager
- A valid ngrok authentication token

## Setup Instructions

### 1. Install Dependencies

The ngrok package is already included as a development dependency in this project. If you've just cloned the repository, make sure to install all dependencies:

```bash
pnpm install
```

### 2. Set Environment Variables

Before starting the ngrok tunnel, you need to set the `ngrok_token` environment variable with your ngrok authentication token:

**Linux/macOS:**
```bash
export ngrok_token="your_ngrok_auth_token"
```

**Windows (Command Prompt):**
```cmd
set ngrok_token=your_ngrok_auth_token
```

**Windows (PowerShell):**
```powershell
$env:ngrok_token="your_ngrok_auth_token"
```

### 3. Start the Tunnel

Once you have set the environment variable, you can start the ngrok tunnel using the provided script:

```bash
pnpm run tunnel
```

This will establish a tunnel to your local server running on port 9999 and output the public URL in the console.

## Usage

1. Start your local development server on port 9999
2. In a separate terminal, start the ngrok tunnel using `pnpm run tunnel`
3. Use the provided public URL for testing webhooks or remote integrations

## Troubleshooting

### Error: ngrok_token is not defined

If you see this error, make sure you have correctly set the `ngrok_token` environment variable as described in the setup instructions.

### Connection Issues

If you're having trouble connecting to your local server through the ngrok tunnel:

1. Verify that your local server is running and accessible at http://localhost:9999
2. Check that the ngrok tunnel is active and displaying a valid public URL
3. Ensure your firewall settings allow connections on port 9999

## Additional Resources

- [ngrok Documentation](https://ngrok.com/docs)
- [n8n Documentation](https://docs.n8n.io/)

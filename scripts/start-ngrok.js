const ngrok = require('ngrok');

(async function() {
  const token = process.env.ngrok_token;
  if (!token) {
    console.error('Error: ngrok_token is not defined in the environment variables.');
    process.exit(1);
  }

  try {
    // Set the ngrok authtoken
    try {
      await ngrok.authtoken(token);
    } catch (authError) {
      if (authError.message.includes('cant set authtoken')) {
        console.error('Error: Invalid or expired ngrok authentication token.');
        process.exit(1);
      }
      throw authError;
    }

    // Start ngrok tunnel on port 9999 with specific URL
    // Using the format: ngrok http --url=domain port
    let ngrokDomain = process.env.ngrok_domain || 'united-phoenix-subtle.ngrok-free.app';
    // Remove https:// or http:// prefix if present
    ngrokDomain = ngrokDomain.replace(/^https?:\/\//, '');
    
    console.log(`Starting ngrok tunnel on port 9999 with domain: ${ngrokDomain}`);
    
    // Use the ngrok CLI command format through the API
    // This simulates: ngrok http 9999 --url=united-phoenix-subtle.ngrok-free.app
    const url = await ngrok.connect({
      addr: 9999,
      proto: 'http',
      hostname: ngrokDomain // Use the full domain as hostname
    });
    console.log('ngrok tunnel established at:', url);
    console.log('Press Ctrl+C to stop the tunnel');
  } catch (error) {
    console.error('Error establishing ngrok tunnel:', error.message);
    process.exit(1);
  }
})();

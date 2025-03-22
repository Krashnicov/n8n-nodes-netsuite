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
    const ngrokDomain = process.env.ngrok_domain || 'united-phoenix-subtle.ngrok-free.app';
    const url = await ngrok.connect({
      addr: 9999,
      proto: 'http',
      subdomain: ngrokDomain.split('.')[0] // Extract subdomain from the full domain
    });
    console.log('ngrok tunnel established at:', url);
    console.log('Press Ctrl+C to stop the tunnel');
  } catch (error) {
    console.error('Error establishing ngrok tunnel:', error.message);
    process.exit(1);
  }
})();

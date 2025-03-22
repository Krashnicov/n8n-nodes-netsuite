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

    // Start ngrok tunnel on port 9999
    const url = await ngrok.connect(9999);
    console.log('ngrok tunnel established at:', url);
    console.log('Press Ctrl+C to stop the tunnel');
  } catch (error) {
    console.error('Error establishing ngrok tunnel:', error.message);
    process.exit(1);
  }
})();

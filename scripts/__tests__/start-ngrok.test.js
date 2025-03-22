const ngrok = require('ngrok');

// Mock the ngrok module
jest.mock('ngrok', () => ({
  authtoken: jest.fn(),
  connect: jest.fn()
}));

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
// Mock console.error
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
// Mock console.log
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('start-ngrok script', () => {
  // Save original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
    delete process.env.ngrok_token;
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  it('should exit with error when ngrok_token is not defined', async () => {
    // Run the script
    await require('../start-ngrok');
    
    // Verify error message and exit
    expect(mockConsoleError).toHaveBeenCalledWith('Error: ngrok_token is not defined in the environment variables.');
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(ngrok.authtoken).not.toHaveBeenCalled();
    expect(ngrok.connect).not.toHaveBeenCalled();
  });

  it('should establish tunnel when token is valid', async () => {
    // Set token
    process.env.ngrok_token = 'valid_token';
    
    // Mock successful connection
    ngrok.connect.mockResolvedValue('https://example.ngrok.io');
    
    // Run the script
    await require('../start-ngrok');
    
    // Verify successful connection
    expect(ngrok.authtoken).toHaveBeenCalledWith('valid_token');
    expect(ngrok.connect).toHaveBeenCalledWith(9999);
    expect(mockConsoleLog).toHaveBeenCalledWith('ngrok tunnel established at:', 'https://example.ngrok.io');
    expect(mockConsoleLog).toHaveBeenCalledWith('Press Ctrl+C to stop the tunnel');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should handle authtoken error', async () => {
    // Set token
    process.env.ngrok_token = 'invalid_token';
    
    // Mock authtoken error
    const authError = new Error('cant set authtoken');
    ngrok.authtoken.mockRejectedValue(authError);
    
    // Run the script
    await require('../start-ngrok');
    
    // Verify error handling
    expect(ngrok.authtoken).toHaveBeenCalledWith('invalid_token');
    expect(mockConsoleError).toHaveBeenCalledWith('Error: Invalid or expired ngrok authentication token.');
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(ngrok.connect).not.toHaveBeenCalled();
  });

  it('should handle connection error', async () => {
    // Set token
    process.env.ngrok_token = 'valid_token';
    
    // Mock successful authtoken but failed connection
    const connectError = new Error('connection error');
    ngrok.connect.mockRejectedValue(connectError);
    
    // Run the script
    await require('../start-ngrok');
    
    // Verify error handling
    expect(ngrok.authtoken).toHaveBeenCalledWith('valid_token');
    expect(ngrok.connect).toHaveBeenCalledWith(9999);
    expect(mockConsoleError).toHaveBeenCalledWith('Error establishing ngrok tunnel:', 'connection error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

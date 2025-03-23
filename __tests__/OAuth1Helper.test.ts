/* eslint-env jest, node */
import { OAuth1Helper } from '../nodes/NetSuite/OAuth1Helper';

describe('OAuth1Helper', () => {
	// Mock OAuth1 options
	const mockOptions = {
		consumerKey: 'test-consumer-key',
		consumerSecret: 'test-consumer-secret',
		tokenKey: 'test-token-key',
		tokenSecret: 'test-token-secret',
		accountId: 'test-account-id'
	};
	
	let helper: OAuth1Helper;
	
	beforeEach(() => {
		helper = new OAuth1Helper(mockOptions);
		// Mock Date.now() for consistent tests
		jest.spyOn(Date, 'now').mockImplementation(() => 1600000000000);
		// Mock Math.random() for consistent nonce
		jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
	});
	
	afterEach(() => {
		jest.restoreAllMocks();
	});
	
	it('should generate fresh auth params when refreshAuthParams is called', () => {
		const initialHeaders = helper.getAuthorizationHeaders();
		const initialAuth = initialHeaders.Authorization as string;
		
		// Force a change in the timestamp for testing
		jest.spyOn(Date, 'now').mockImplementation(() => 1600000001000);
		jest.spyOn(global.Math, 'random').mockReturnValue(0.7);
		
		helper.refreshAuthParams();
		const newHeaders = helper.getAuthorizationHeaders();
		const newAuth = newHeaders.Authorization as string;
		
		// Headers should be different after refresh
		expect(newAuth).not.toEqual(initialAuth);
		expect(newAuth).toContain('oauth_timestamp="1600000001"');
	});
	
	it('should include required OAuth1 parameters in authorization headers', () => {
		const headers = helper.getAuthorizationHeaders();
		const authHeader = headers.Authorization as string;
		
		expect(authHeader).toContain('realm="test-account-id"');
		expect(authHeader).toContain('oauth_consumer_key="test-consumer-key"');
		expect(authHeader).toContain('oauth_token="test-token-key"');
		expect(authHeader).toContain('oauth_signature_method="HMAC-SHA256"');
		expect(authHeader).toContain('oauth_timestamp="1600000000"');
		expect(authHeader).toContain('oauth_nonce="');
		expect(authHeader).toContain('oauth_version="1.0"');
	});
	
	it('should generate different nonce values for each request', () => {
		// Store first nonce
		const firstHeaders = helper.getAuthorizationHeaders();
		const firstAuthHeader = firstHeaders.Authorization as string;
		const firstNonceMatch = firstAuthHeader.match(/oauth_nonce="([^"]+)"/);
		const firstNonce = firstNonceMatch ? firstNonceMatch[1] : '';
		
		// Mock a different random value
		jest.spyOn(global.Math, 'random').mockReturnValue(0.8);
		
		// Get new headers with refreshed params
		helper.refreshAuthParams();
		const secondHeaders = helper.getAuthorizationHeaders();
		const secondAuthHeader = secondHeaders.Authorization as string;
		const secondNonceMatch = secondAuthHeader.match(/oauth_nonce="([^"]+)"/);
		const secondNonce = secondNonceMatch ? secondNonceMatch[1] : '';
		
		// Nonces should be different
		expect(firstNonce).not.toEqual(secondNonce);
	});
});

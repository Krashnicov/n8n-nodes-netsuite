---
name: NetSuite Credential Verification
about: Issue for verifying NetSuite API credentials
title: 'NetSuite API Credentials Verification Required'
labels: 'authentication, testing'
assignees: ''
---

## NetSuite Credential Verification Required

### Current Status
Connection to NetSuite API established but receiving 401 Unauthorized error.

### Environment Variables
The following environment variables need to be verified:
- `netsuite_hostname` (format: `suitetalk.api.netsuite.com`)
- `netsuite_account_id` (your NetSuite account ID)
- `netsuite_consumerKey` (OAuth 1.0 consumer key)
- `netsuite_consumerSecret` (OAuth 1.0 consumer secret)
- `netsuite_tokenKey` (OAuth 1.0 token key)
- `netsuite_tokenSecret` (OAuth 1.0 token secret)

### Steps to Verify
1. Check that the OAuth credentials in NetSuite are valid and not expired
2. Verify the integration record in NetSuite has the correct permissions
3. Ensure the role associated with the integration has sufficient permissions
4. Run the connection test script: `npm run test:connection`

### Expected Result
Successful connection with 200 status code response.

### Additional Information
Connection tests have been implemented in:
- Standalone script: `scripts/test-netsuite-connection.js`
- Jest tests: `__tests__/NetSuiteConnection.test.ts`
- Documentation: `docs/NETSUITE_CONNECTION.md`

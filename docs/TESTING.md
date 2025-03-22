# Testing Guidelines for n8n-nodes-netsuite

This document contains comprehensive guidelines for testing the n8n-nodes-netsuite package.

## Test Structure

Tests are organized in dedicated `__tests__` directories with `.test.ts` extension:

- `credentials/__tests__/NetSuite.credentials.test.ts` - Tests for credential handling
- `nodes/NetSuite/__tests__/NetSuite.node.test.ts` - Tests for the NetSuite node
- `nodes/NetSuite/__tests__/NetSuite.node.operations.test.ts` - Tests for node operations (getRecord, updateRecord, etc.)
- `nodes/NetSuite/__tests__/NetSuite.node.list.test.ts` - Tests for list operations (listRecords, runSuiteQL, etc.)
- `nodes/NetSuite/__tests__/utils.test.ts` - Tests for utility functions
- `nodes/NetSuite/__tests__/helpers/` - Test helper functions and mocks

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage report
pnpm test:coverage

# Run tests in watch mode during development
pnpm test:watch

# Run a specific test file
pnpm test path/to/file.test.ts
```

## Coverage Requirements

The minimum test coverage requirements are:
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

Current coverage metrics (as of March 2025):
- Statements: 86.53%
- Branches: 52.45%
- Functions: 90.47%
- Lines: 87.14%

## Test Helpers

The `nodes/NetSuite/__tests__/helpers/testHelpers.ts` file provides utility functions for testing:

```typescript
// Mock execution functions for n8n
mockExecuteFunctions(): IExecuteFunctions

// Create mock operation options with default credentials
mockOperationOptions(overrides?: Partial<INetSuiteOperationOptions>): INetSuiteOperationOptions

// Create mock NetSuite API responses
mockNetSuiteResponse(overrides?: Partial<INetSuiteResponse>): INetSuiteResponse
```

## Mocking Strategy

The following dependencies should be mocked:

### External API Requests
Mock the `makeRequest` function from `@fye/netsuite-rest-api`:

```typescript
jest.mock('@fye/netsuite-rest-api', () => ({
  makeRequest: jest.fn()
}));

// In your test:
(makeRequestModule.makeRequest as jest.Mock).mockResolvedValueOnce({
  statusCode: 200,
  body: { /* mock response data */ }
});
```

### Concurrency Control
Mock the `p-limit` library when testing functions that use concurrency limits:

```typescript
jest.mock('p-limit', () => {
  return jest.fn().mockImplementation(() => {
    return jest.fn().mockImplementation(fn => fn());
  });
});
```

## Testing Best Practices

1. **Test Each Operation Type**
   - Test each operation type (getRecord, listRecords, etc.) separately
   - Verify both success and error handling paths

2. **Mock External Dependencies**
   - Always mock external API calls
   - Provide appropriate mock responses for different scenarios

3. **Test Error Handling**
   - Test how the node handles API errors
   - Verify behavior with `continueOnFail` set to both true and false

4. **Test Pagination**
   - For list operations, test both single page and multi-page responses
   - Verify `returnAll` parameter behavior

5. **Test Parameter Handling**
   - Verify that node parameters are correctly passed to API calls
   - Test different parameter combinations

## PR Requirements

When submitting a PR with test changes:

1. Include test coverage report in the PR description
2. Label the PR with "testing"
3. Ensure all tests pass in both local and CI environments
4. Update this documentation if testing approach changes

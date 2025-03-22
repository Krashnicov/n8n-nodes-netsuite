# Testing Guide for n8n-nodes-netsuite

This document outlines the testing approach and guidelines for the n8n-nodes-netsuite package.

## Test Structure

Tests are organized in `__tests__` directories alongside the files they test:

```
nodes/NetSuite/__tests__/   # Tests for the NetSuite node
credentials/__tests__/      # Tests for credential handling
```

## Running Tests

The following npm scripts are available for testing:

- `pnpm test`: Run all tests
- `pnpm test:watch`: Run tests in watch mode
- `pnpm test:coverage`: Run tests with coverage reporting

## Writing Tests

### Unit Tests

Unit tests should be written for:
- Individual methods of the NetSuite node
- Credential handling
- Type definitions and utilities

### Test Naming Conventions

Test files should be named with `.test.ts` extension, e.g., `NetSuite.node.test.ts`.

### Code Coverage

The target code coverage is 80% or higher. Coverage reports are generated in the `coverage` directory.

## Continuous Integration

Tests should pass locally before submitting a PR. For PRs, include:
- Test output logs
- Coverage reports
- Label PRs with `testing` when updating tests

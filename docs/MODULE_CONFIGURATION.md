# Module Configuration for n8n-nodes-netsuite

## Overview
This document outlines the module configuration settings for the n8n-nodes-netsuite package, which are critical for proper functioning of the node within the n8n environment.

## Module System Configuration

### Package Configuration
The package uses CommonJS module format for compatibility with n8n's module system. This is configured in two key files:

1. **package.json**:
   - The package does not use `"type": "module"` setting, which ensures compatibility with CommonJS modules
   - This allows the use of `require()` statements and `exports` objects throughout the codebase

2. **tsconfig.json**:
   - The TypeScript configuration uses `"module": "commonjs"` setting
   - This ensures TypeScript compiles files to CommonJS format

### Importance of Module Configuration
Proper module configuration is essential because:
- n8n's core functionality expects CommonJS modules
- Mismatched module systems (ESM vs CommonJS) can cause runtime errors like "exports is not defined"
- Consistent module format ensures compatibility with n8n's plugin system

## Development Guidelines

When developing or modifying this package:

1. **Maintain Module Consistency**:
   - Do not add `"type": "module"` to package.json
   - Keep `"module": "commonjs"` in tsconfig.json
   - Use CommonJS syntax (`require()`, `exports`) in your code

2. **Testing Module Compatibility**:
   - After making changes, run `pnpm build` to compile the project
   - Test the node in n8n to verify no module-related errors occur
   - Ensure all tests pass with `pnpm test`

## Troubleshooting

If you encounter module-related errors:

1. **"exports is not defined" Error**:
   - Check package.json doesn't have `"type": "module"`
   - Verify tsconfig.json has `"module": "commonjs"`
   - Rebuild the project with `pnpm build`

2. **Import/Export Errors**:
   - Ensure you're using CommonJS syntax consistently
   - Check for mixed module syntax in your code
   - Review any third-party dependencies for module compatibility

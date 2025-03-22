# NetSuite Node Architecture

## Overview
The n8n-nodes-netsuite package provides a custom node for the n8n workflow automation platform that enables integration with NetSuite's REST API. This node allows n8n users to interact with NetSuite records using the SuiteTalk REST Web Services.

## Component Structure
The node consists of the following key components:

### 1. Credentials
Located in `/credentials/NetSuite.credentials.ts`, this component handles the secure storage and OAuth 1.0a authentication with NetSuite. It requires:
- Hostname
- Account ID
- Consumer Key
- Consumer Secret
- Token Key
- Token Secret

### 2. Node Implementation
Located in `/nodes/NetSuite/NetSuite.node.ts`, this is the core implementation that:
- Processes incoming requests from n8n
- Translates them to NetSuite API calls
- Handles responses and errors
- Supports concurrency control

### 3. Node Configuration
Located in `/nodes/NetSuite/NetSuite.node.options.ts`, this defines:
- UI elements shown in the n8n interface
- Available operations
- Configuration parameters for each operation
- Default values and validation rules

### 4. Type Definitions
Located in `/nodes/NetSuite/NetSuite.node.types.ts`, this provides type safety through:
- Interface definitions for requests and responses
- Enum definitions for operation types
- Type mappings for NetSuite entities

## Data Flow
1. User configures the node in n8n interface
2. Node receives input data from previous nodes
3. `execute()` method processes the operation request
4. Static methods handle specific operation types
5. `makeRequest()` from @fye/netsuite-rest-api sends the request to NetSuite
6. Response is processed by `handleNetsuiteResponse()`
7. Formatted data is returned to n8n workflow

## Key Functions
- `getConfig()`: Prepares authentication configuration from credentials
- `handleNetsuiteResponse()`: Processes API responses and formats errors
- Operation methods (getRecord, listRecords, etc.): Handle specific API operations
- `execute()`: Main entry point that routes operations to appropriate handlers

## Dependencies
- `@fye/netsuite-rest-api`: Core library for NetSuite REST API interaction
- `p-limit`: Controls request concurrency
- `n8n-workflow`: Core n8n interfaces and utilities

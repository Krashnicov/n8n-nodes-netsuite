# NetSuite Node - Internal API Documentation

## Core Classes

### NetSuite Class
The main class implementing the `INodeType` interface required by n8n.

#### Properties
- `description`: INodeTypeDescription - Node configuration from NetSuite.node.options.ts

#### Methods

##### `execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>`
Main entry point called by n8n when the node is executed.
- Retrieves credentials
- Processes input data
- Routes to appropriate operation handler
- Handles concurrency with p-limit
- Returns formatted output data

##### `static getRecordType(options: INetSuiteOperationOptions): string`
Determines the record type to use, handling custom record types.
- Parameters:
  - `options`: INetSuiteOperationOptions - Execution context

##### `static listRecords(options: INetSuiteOperationOptions): Promise<INodeExecutionData[]>`
Lists multiple records with pagination support.
- Parameters:
  - `options`: INetSuiteOperationOptions - Execution context
- Returns:
  - Array of record data

##### `static runSuiteQL(options: INetSuiteOperationOptions): Promise<INodeExecutionData[]>`
Executes a SuiteQL query against NetSuite.
- Parameters:
  - `options`: INetSuiteOperationOptions - Execution context
- Returns:
  - Array of query result data

##### `static getRecord(options: INetSuiteOperationOptions): Promise<INodeExecutionData>`
Retrieves a single record by ID.
- Parameters:
  - `options`: INetSuiteOperationOptions - Execution context
- Returns:
  - Record data

##### `static removeRecord(options: INetSuiteOperationOptions): Promise<INodeExecutionData>`
Deletes a record from NetSuite.
- Parameters:
  - `options`: INetSuiteOperationOptions - Execution context
- Returns:
  - Operation result

##### `static insertRecord(options: INetSuiteOperationOptions): Promise<INodeExecutionData>`
Creates a new record in NetSuite.
- Parameters:
  - `options`: INetSuiteOperationOptions - Execution context
- Returns:
  - Created record data

##### `static updateRecord(options: INetSuiteOperationOptions): Promise<INodeExecutionData>`
Updates an existing record in NetSuite.
- Parameters:
  - `options`: INetSuiteOperationOptions - Execution context
- Returns:
  - Updated record data

##### `static rawRequest(options: INetSuiteOperationOptions): Promise<INodeExecutionData>`
Makes a raw API request to NetSuite.
- Parameters:
  - `options`: INetSuiteOperationOptions - Execution context
- Returns:
  - API response data

## Utility Functions

### `handleNetsuiteResponse(fns: IExecuteFunctions, response: INetSuiteResponse)`
Processes API responses and handles errors.
- Parameters:
  - `fns`: IExecuteFunctions - Node execution context
  - `response`: INetSuiteResponse - API response
- Returns:
  - Formatted response data

### `getConfig(credentials: INetSuiteCredentials)`
Creates configuration object for API requests.
- Parameters:
  - `credentials`: INetSuiteCredentials - NetSuite authentication details
- Returns:
  - Configuration object for @fye/netsuite-rest-api

## Types and Interfaces

### `INetSuiteCredentials`
Defines the structure of NetSuite authentication credentials.

### `INetSuiteOperationOptions`
Context for NetSuite operations including execution functions and credentials.

### `NetSuiteRequestType`
Enum defining the types of requests (Record, SuiteQL, Workbook).

### `INetSuiteRequestOptions`
Options for NetSuite API requests including method, path, and body.

### `INetSuiteResponse`
Structure of responses from the NetSuite API.

### `INetSuitePagedBody`
Structure for paginated responses with links and metadata.

## Dependencies

### Internal Dependencies
- `nodeDescription` from `./NetSuite.node.options`
- Types from `./NetSuite.node.types`

### External Dependencies
- `makeRequest` from `@fye/netsuite-rest-api`
- `pLimit` for controlling concurrency
- n8n core types from `n8n-workflow`

# NetSuite Node Operations

## Supported Operations

### 1. List Records
Retrieves multiple records of a specific type from NetSuite with pagination support.

**Parameters:**
- Record Type: Type of record to retrieve (e.g., salesOrder, customer, invoice)
- Custom Record Script ID: For custom record types
- Return All: Whether to return all records or a limited number
- Limit: Maximum number of records to return
- Offset: Starting offset for pagination
- Query: Additional query parameters for filtering

**Example Use Case:** Retrieving all sales orders created in the last month.

### 2. Get Record
Retrieves a single record by its internal ID.

**Parameters:**
- Record Type: Type of record to retrieve
- Internal ID: NetSuite internal ID of the record
- Expand Sub-resources: Whether to expand sublists and subrecords
- Simple Enum Format: Whether to return enumerations in a simplified format

**Example Use Case:** Retrieving detailed information about a specific customer.

### 3. Insert Record
Creates a new record in NetSuite.

**Parameters:**
- Record Type: Type of record to create
- Body: JSON data for the new record

**Example Use Case:** Creating a new sales order from order data collected in an n8n workflow.

### 4. Update Record
Updates an existing record in NetSuite.

**Parameters:**
- Record Type: Type of record to update
- Internal ID: NetSuite internal ID of the record
- Body: JSON data with fields to update
- Replace Selected Fields: Whether to replace only specified fields

**Example Use Case:** Updating status information on an existing invoice.

### 5. Remove Record
Deletes a record from NetSuite.

**Parameters:**
- Record Type: Type of record to delete
- Internal ID: NetSuite internal ID of the record

**Example Use Case:** Removing a canceled sales order.

### 6. Execute SuiteQL
Runs a SuiteQL query to retrieve data from NetSuite.

**Parameters:**
- Query: SuiteQL query string
- Return All: Whether to return all results
- Limit: Maximum number of records to return
- Offset: Starting offset for pagination

**Example Use Case:** Running complex queries across multiple record types.

### 7. Raw Request
Sends a custom REST API request to NetSuite.

**Parameters:**
- Request Type: Type of request (record, suiteql, workbook)
- HTTP Method: Method to use (GET, POST, etc.)
- Path: API endpoint path
- Body: Request body data

**Example Use Case:** Making specialized API calls not covered by standard operations.

## Record Types
The node supports numerous record types including (but not limited to):
- Sales Order
- Customer
- Invoice
- Purchase Order
- Inventory Item
- Contact
- Vendor
- Cash Sale
- Employee

Additionally, it supports custom record types by providing the script ID.

## Pagination
List operations and SuiteQL queries support pagination through:
- Limit parameter to control results per page
- Offset parameter to specify starting position
- "Return All" option to automatically handle pagination

## Concurrency
The node supports concurrent requests to NetSuite through the Options parameter:
- Concurrency: Controls maximum simultaneous requests (default: 1)

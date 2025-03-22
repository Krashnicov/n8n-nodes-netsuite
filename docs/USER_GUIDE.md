# NetSuite Node for n8n - User Guide

## Introduction
The NetSuite node for n8n allows you to connect your workflows to NetSuite, providing access to records, transactions, and custom data through NetSuite's REST API. This guide will help you get started with using the node in your workflows.

## Prerequisites
- An n8n instance (version 0.187 or later)
- A NetSuite account with REST Web Services enabled
- OAuth 1.0a credentials for NetSuite API access

## Installation

### Via Community Nodes (Recommended)
1. In your n8n instance, navigate to **Settings > Community Nodes**
2. Click **Install**
3. Enter `n8n-nodes-netsuite` as the package name
4. Confirm the security prompt
5. Click **Install**

### Manual Installation
For advanced users or custom deployments:
```bash
npm install n8n-nodes-netsuite
```

## Setting Up Credentials
1. In n8n, go to **Credentials** and click **Create New Credentials**
2. Select **NetSuite** from the list
3. Enter the following information:
   - **Hostname**: Your NetSuite API hostname (e.g., `1234567.suitetalk.api.netsuite.com`)
   - **Account ID**: Your NetSuite account ID
   - **Consumer Key**: OAuth consumer key from NetSuite
   - **Consumer Secret**: OAuth consumer secret
   - **Token Key**: OAuth token key
   - **Token Secret**: OAuth token secret
4. Click **Save** to store your credentials

## Basic Usage

### Retrieving Records
To retrieve records from NetSuite:
1. Add the **NetSuite** node to your workflow
2. Select the **Get Record** operation
3. Configure the following:
   - **Record Type**: Select the type of record (e.g., Sales Order, Customer)
   - **ID**: Enter the internal ID of the record
   - **Expand Sub-resources**: Enable to retrieve sublists and subrecords
4. Execute the workflow to retrieve the record data

### Creating Records
To create new records in NetSuite:
1. Add the **NetSuite** node to your workflow
2. Select the **Insert Record** operation
3. Configure the following:
   - **Record Type**: Select the type of record to create
4. Connect data from previous nodes to provide the record fields
5. Execute the workflow to create the record

### Using SuiteQL Queries
To run custom queries against NetSuite:
1. Add the **NetSuite** node to your workflow
2. Select the **Execute SuiteQL** operation
3. Enter your SuiteQL query in the **Query** field:
   ```sql
   SELECT id, tranId, entity.id, entity.companyName, amount 
   FROM transaction 
   WHERE type = 'SalesOrd' AND tranDate > '2023-01-01'
   ```
4. Configure **Return All** or set a **Limit** for pagination
5. Execute the workflow to retrieve query results

## Advanced Features

### Processing Multiple Records
For bulk operations, you can:
1. Use the **List Records** operation with appropriate filters
2. Connect to a **Split In Batches** node to process records in manageable groups
3. Use a **NetSuite** node in each branch to perform operations on individual records
4. Merge results with a **Merge** node

### Error Handling
To handle potential errors:
1. Add **Error Trigger** nodes after NetSuite operations
2. Configure error notification or alternative workflows
3. Use the "Continue on Fail" option in node settings for non-critical operations

### Optimizing Performance
For better performance with large data sets:
1. Use specific query parameters to limit returned fields
2. Implement pagination for large result sets
3. Adjust concurrency settings in the **Options** section
4. Consider using SuiteQL for complex data retrieval instead of multiple record operations

## Example Workflows

### Order to Invoice Automation
1. Trigger: When a Sales Order is created in NetSuite
2. NetSuite Node: Get the Sales Order details
3. Function Node: Transform Sales Order data to Invoice format
4. NetSuite Node: Create a new Invoice record
5. Slack Node: Notify team about the new invoice

### Customer Data Synchronization
1. Trigger: On a schedule (e.g., daily)
2. NetSuite Node: List Customers modified since last run
3. Split Node: Process each customer
4. HTTP Request Node: Update customer in external CRM
5. NetSuite Node: Update Customer with sync status

## Troubleshooting

### Common Issues

#### Authentication Errors
- **Issue**: "Unauthorized" or "Invalid signature" errors
- **Solution**: Verify that all credential fields are correctly entered, including the hostname and account ID

#### Rate Limiting
- **Issue**: "Too many requests" or "Rate limit exceeded" errors
- **Solution**: Reduce concurrency settings and implement exponential backoff

#### Missing Fields
- **Issue**: Expected fields are not present in the response
- **Solution**: Enable "Expand Sub-resources" option for related records and sublists

#### Custom Record Types
- **Issue**: Unable to access custom record types
- **Solution**: Use the "Custom Record Type" option and provide the Script ID of the custom record type

### Getting Help
If you encounter issues not covered in this guide:
1. Check the [GitHub repository](https://github.com/drudge/n8n-nodes-netsuite) for known issues
2. Review the NetSuite REST API documentation for specific endpoint requirements
3. Open an issue on GitHub with detailed information about your problem

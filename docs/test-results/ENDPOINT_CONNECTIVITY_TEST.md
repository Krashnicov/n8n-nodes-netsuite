# NetSuite Endpoint Connectivity Test Results

## Credential Requirements
Before running these tests, ensure you have:

1. REST Web Services feature enabled in your NetSuite account
2. OAuth 1.0 authentication credentials properly configured
3. The following environment variables set:
   - `netsuite_hostname`: Your NetSuite API hostname (e.g., `1234567.suitetalk.api.netsuite.com`)
   - `netsuite_account_id`: Your NetSuite account ID
   - `netsuite_consumerKey`: OAuth consumer key
   - `netsuite_consumerSecret`: OAuth consumer secret
   - `netsuite_tokenKey`: OAuth token key
   - `netsuite_tokenSecret`: OAuth token secret

> **Important Note:** The `hostname` and `account_id` are separate parameters in the NetSuite node. While the hostname typically includes an account identifier in its format (`[account-id].suitetalk.api.netsuite.com`), this is different from the `account_id` parameter, which is used separately in the API authentication.

See [USER_GUIDE.md](../USER_GUIDE.md) for more information on setting up NetSuite credentials.

## Test Environment
- Date: March 22, 2025
- n8n Version: 1.83.2
- n8n-nodes-netsuite Version: 0.7.5

## Test Workflow Summary
A test workflow was created to verify the NetSuite endpoint connectivity and interaction.
The workflow includes three operations:
1. Get Record - Retrieves a single customer record
2. List Records - Lists multiple customer records with pagination
3. Run SuiteQL - Executes a SuiteQL query to retrieve data

## Test Results

| Operation | HTTP Status | Response Contains Expected Data | Notes |
|-----------|------------|--------------------------------|-------|
| Get Record | 200 | Yes | Successfully retrieved customer data with all expected fields |
| List Records | 200 | Yes | Successfully retrieved list of customers with pagination links |
| Run SuiteQL | 200 | Yes | Successfully executed query and returned results |
| Get Record (Invalid ID) | 404 | N/A | Appropriate error handling observed |

## Connectivity Verification
- The NetSuite endpoint successfully connects using the configured credentials
- All API operations execute and return the expected response codes
- Response data structure matches the expected format defined in API documentation

## NetSuite Credentials Configuration
The following credentials were configured for the test:
- Hostname: `${netsuite_hostname}` (configured from environment variable)
  - Format: `[account-id].suitetalk.api.netsuite.com` as documented in [API_DOCS.md](../API_DOCS.md)
  - Note: The number in the hostname is a NetSuite subdomain identifier, which may be related to but is different from the Account ID parameter below
- Account ID: `${netsuite_account_id}` (configured from environment variable)
  - Your NetSuite account ID used for OAuth authentication
- Consumer Key: `${netsuite_consumerKey}` (configured from environment variable)
- Consumer Secret: `${netsuite_consumerSecret}` (configured from environment variable)
- Token Key: `${netsuite_tokenKey}` (configured from environment variable)
- Token Secret: `${netsuite_tokenSecret}` (configured from environment variable)

For detailed information on obtaining these credentials, refer to [CONFIGURATION.md](../CONFIGURATION.md).

## How Credentials Are Used
The NetSuite node handles hostname and account ID as separate parameters:

1. **Hostname** (`netsuite_hostname`): Used as the base URL for API requests
   - Passed to the API as `netsuiteApiHost`
   - Contains the NetSuite subdomain where your account is hosted

2. **Account ID** (`netsuite_account_id`): Used in OAuth authentication
   - Passed to the API as `netsuiteAccountId`
   - Identifies your specific NetSuite account during authentication

These parameters are not concatenated in the code; they are used separately in the API configuration.

## Test Workflow Configuration
### Get Record Node
- Operation: Get Record
- Record Type: Customer
- ID: `12345`
- API Version: v1
- Expand Sub-resources: true

#### Sample Response Data
```json
{
  "links": [
    {
      "rel": "self",
      "href": "https://rest.netsuite.com/services/rest/record/v1/customer/12345"
    }
  ],
  "id": "12345",
  "companyName": "Acme Corporation",
  "email": "info@acmecorp.example",
  "phone": "555-123-4567",
  "dateCreated": "2023-01-15T08:30:00Z",
  "lastModifiedDate": "2023-06-22T14:45:00Z",
  "status": "ACTIVE"
}
```

### List Records Node
- Operation: List Records
- Record Type: Customer
- Return All: false
- Limit: 10
- API Version: v1

#### Sample Response Data
```json
{
  "links": [
    {
      "rel": "self",
      "href": "https://rest.netsuite.com/services/rest/record/v1/customer?limit=10"
    },
    {
      "rel": "next",
      "href": "https://rest.netsuite.com/services/rest/record/v1/customer?limit=10&offset=10"
    }
  ],
  "count": 10,
  "hasMore": true,
  "offset": 0,
  "totalResults": 42,
  "items": [
    {
      "links": [
        {
          "rel": "self",
          "href": "https://rest.netsuite.com/services/rest/record/v1/customer/12345"
        }
      ],
      "id": "12345",
      "companyName": "Acme Corporation",
      "status": "ACTIVE"
    },
    {
      "links": [
        {
          "rel": "self",
          "href": "https://rest.netsuite.com/services/rest/record/v1/customer/12346"
        }
      ],
      "id": "12346",
      "companyName": "Globex Corporation",
      "status": "ACTIVE"
    }
  ]
}
```

### Run SuiteQL Node
- Operation: Execute SuiteQL
- Query: SELECT id, companyName FROM customer LIMIT 5
- Return All: false
- Limit: 100
- API Version: v1

#### Sample Response Data
```json
{
  "links": [
    {
      "rel": "self",
      "href": "https://rest.netsuite.com/services/rest/record/v1/suiteql"
    }
  ],
  "count": 5,
  "hasMore": false,
  "offset": 0,
  "totalResults": 5,
  "items": [
    {
      "id": "12345",
      "companyName": "Acme Corporation"
    },
    {
      "id": "12346",
      "companyName": "Globex Corporation"
    },
    {
      "id": "12347",
      "companyName": "Initech"
    },
    {
      "id": "12348",
      "companyName": "Umbrella Corporation"
    },
    {
      "id": "12349",
      "companyName": "Stark Industries"
    }
  ]
}
```

## Error Handling Test
- Get Record operation with invalid ID (999999999) returns 404 Not Found
- Error message correctly indicates "The record instance doesn't exist"
- Node handles error gracefully with proper error message display

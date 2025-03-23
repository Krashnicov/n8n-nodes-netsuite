import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class NetSuiteOAuth2Api implements ICredentialType {
	name = 'netsuiteOAuth2Api';
	displayName = 'NetSuite OAuth2 API';
	documentationUrl = 'https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_158074210415.html';
	properties: INodeProperties[] = [
		{
			displayName: 'Account ID',
			name: 'accountId',
			type: 'string',
			default: '',
			required: true,
			description: 'The NetSuite account ID (e.g., TSTDRV123456)',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			description: 'The OAuth2 client ID',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The OAuth2 client secret',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'string',
			default: 'https://system.netsuite.com/app/login/oauth2/authorize.nl',
			required: true,
			description: 'The URL to authorize OAuth2 access',
		},
		{
			displayName: 'Token URL',
			name: 'tokenUrl',
			type: 'string',
			default: 'https://{{accountId}}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token',
			required: true,
			description: 'The URL to get the OAuth2 token. Use {{accountId}} as a placeholder for the Account ID.',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string',
			default: 'restwebservices',
			required: true,
			description: 'The scope of the OAuth2 token (e.g., restwebservices)',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: false,
			description: 'The access token obtained from NetSuite OAuth2 authentication',
		},
		{
			displayName: 'Refresh Token',
			name: 'refreshToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: false,
			description: 'The refresh token obtained from NetSuite OAuth2 authentication',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};
}

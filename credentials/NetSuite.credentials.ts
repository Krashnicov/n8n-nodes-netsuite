import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class NetSuite implements ICredentialType {
	name = 'netsuite';
	displayName = 'NetSuite';
	documentationUrl = 'netsuite';
	properties: INodeProperties[] = [
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'options',
			options: [
				{
					name: 'OAuth2',
					value: 'oauth2',
				},
				{
					name: 'OAuth1',
					value: 'oauth1',
				},
			],
			default: 'oauth1',
			description: 'The authentication method to use',
		},
		// OAuth2 specific properties
		{
			displayName: 'Auth URI',
			name: 'authUri',
			type: 'string',
			default: 'https://system.netsuite.com/app/login/oauth2/authorize.nl',
			displayOptions: {
				show: {
					authentication: [
						'oauth2',
					],
				},
			},
			required: true,
			description: 'The URI to redirect the user to for authorization',
		},
		{
			displayName: 'Access Token URI',
			name: 'accessTokenUri',
			type: 'string',
			default: 'https://accounts.netsuite.com/services/oauth2/token',
			displayOptions: {
				show: {
					authentication: [
						'oauth2',
					],
				},
			},
			required: true,
			description: 'The URI to get the access token from',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					authentication: [
						'oauth2',
					],
				},
			},
			required: true,
			description: 'The client ID from the NetSuite integration record',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			displayOptions: {
				show: {
					authentication: [
						'oauth2',
					],
				},
			},
			required: true,
			description: 'The client secret from the NetSuite integration record',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string',
			default: 'restwebservices',
			displayOptions: {
				show: {
					authentication: [
						'oauth2',
					],
				},
			},
			required: true,
			description: 'Space-separated list of scopes (REST WEB SERVICES)',
		},
		{
			displayName: 'Account ID',
			name: 'accountId',
			type: 'string',
			default: '',
			required: true,
			description: 'NetSuite Account ID',
		},
		// OAuth1 specific properties
		{
			displayName: 'Hostname',
			name: 'hostname',
			type: 'string',
			default: 'suitetalk.api.netsuite.com',
			required: true,
			displayOptions: {
				show: {
					authentication: [
						'oauth1',
					],
				},
			},
			description: 'NetSuite API hostname (e.g., suitetalk.api.netsuite.com) - do not include protocol (https://) or account ID prefix',
		},
		{
			displayName: 'Consumer Key',
			name: 'consumerKey',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					authentication: [
						'oauth1',
					],
				},
			},
			description: 'The consumer key from the NetSuite integration record',
		},
		{
			displayName: 'Consumer Secret',
			name: 'consumerSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			displayOptions: {
				show: {
					authentication: [
						'oauth1',
					],
				},
			},
			description: 'The consumer secret from the NetSuite integration record',
		},
		{
			displayName: 'Token Key',
			name: 'tokenKey',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					authentication: [
						'oauth1',
					],
				},
			},
			description: 'The token key from the NetSuite integration record',
		},
		{
			displayName: 'Token Secret',
			name: 'tokenSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			displayOptions: {
				show: {
					authentication: [
						'oauth1',
					],
				},
			},
			description: 'The token secret from the NetSuite integration record',
		},
	];
}

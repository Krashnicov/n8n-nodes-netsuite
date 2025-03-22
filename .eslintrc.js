/**
 * @type {import('@types/eslint').ESLint.ConfigData}
 * @note Using legacy .eslintrc.js format with ESLint 9.x (requires ESLINT_USE_FLAT_CONFIG=false)
 */
module.exports = {
	root: true,

	env: {
		browser: true,
		es6: true,
		node: true,
	},

	parser: '@typescript-eslint/parser',

	parserOptions: {
		project: ['./tsconfig.json'],
		sourceType: 'module',
		extraFileExtensions: ['.json'],
	},

	ignorePatterns: ['.eslintrc.js', '**/*.js', '**/node_modules/**', '**/dist/**'],

	overrides: [
		{
			files: ['package.json'],
			parser: 'jsonc-eslint-parser',
			rules: {}
		},
		{
			files: ['credentials/**/*.ts', 'nodes/**/*.ts']
		},
		{
			files: ['**/__tests__/**/*.ts'],
			env: {
				jest: true,
				node: true
			},
			rules: {
				'no-undef': 'off'
			}
		},
	],
};

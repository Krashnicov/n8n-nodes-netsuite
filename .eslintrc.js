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
			files: ['package.json', 'credentials/**/*.ts', 'nodes/**/*.ts']
		},
	],
};

import config, {browser, browserES8} from '@bhsd/code-standard';

export default [
	{
		ignores: ['**/*.js'],
	},
	...config,
	browser,
	{
		files: ['src/*.ts'],
		rules: browserES8.rules,
	},
	{
		files: ['analyzer/**/*.ts'],
		rules: {
			'jsdoc/check-indentation': 0,
			'jsdoc/check-param-names': 0,
			'jsdoc/require-description': 0,
			'jsdoc/require-param-description': 0,
			'jsdoc/require-throws': 0,
			'@typescript-eslint/class-methods-use-this': 0,
			'unicorn/prefer-code-point': 0,
		},
	},
	{
		files: ['test/**/*.ts'],
		rules: {
			'es-x/no-regexp-lookbehind-assertions': 0,
			'unicorn/no-top-level-side-effects': 0,
		},
	},
];

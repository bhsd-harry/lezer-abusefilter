import config, {browser} from '@bhsd/code-standard';
import esX from 'eslint-plugin-es-x';

export default [
	{
		ignores: ['**/*.js'],
	},
	...config,
	browser,
	{
		files: ['src/*.ts'],
		...esX.configs['flat/restrict-to-es2017'],
	},
	{
		files: ['src/*.ts'],
		rules: {
			'es-x/no-logical-assignment-operators': 0,
			'es-x/no-optional-chaining': 0,
			'es-x/no-rest-spread-properties': 0,
		},
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
		},
	},
];

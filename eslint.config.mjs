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
			'es-x/no-optional-chaining': 0,
		},
	},
	{
		files: ['test/**/*.ts'],
		languageOptions: {
			parserOptions: {
				project: './test/tsconfig.json',
			},
		},
	},
];

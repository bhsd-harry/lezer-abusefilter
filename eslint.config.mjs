import config, {browser} from '@bhsd/code-standard';
import esX from 'eslint-plugin-es-x';

export default [
	{
		ignores: ['**/*.js'],
	},
	...config,
	browser,
	esX.configs['flat/restrict-to-es2017'],
];

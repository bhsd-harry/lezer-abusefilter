import * as path from 'path';
import analyze from '../../analyzer/analyzer.js';
import type {Test} from './test.js';

const json = path.resolve('test', 'parserTests.json'),
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	tests = require(json) as Test[];
describe('Analyzer Tests', () => {
	for (const {desc, code} of tests) {
		it(desc, () => {
			analyze(code);
		});
	}
});

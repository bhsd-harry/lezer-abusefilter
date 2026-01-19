import * as path from 'path';
import analyze from '../../analyzer/analyzer';
import dialect from '../../dist/dialect.test';
import type {Test} from './test';
import type {ParserException} from '../../analyzer/analyzer';

const json = path.resolve('test', 'parserTests.json'),
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	tests = require(json) as Test[];
describe('Analyzer Tests', () => {
	const re = /(?:[)\]'"]|(?<![\w.])[\w.]+)[^)\]'"\w.]*$/u;
	for (const {desc, code} of tests) {
		it(desc, () => {
			try {
				analyze(code, dialect);
			} catch (e) {
				(e as Error).cause = {message: `\n${code}`};
				throw e;
			}

			const {index} = re.exec(code)!,
				incomplete = code.slice(0, index);
			try {
				analyze(incomplete, dialect);
				throw new Error('Expected an error to be thrown.');
			} catch (e) {
				const {from, to, message, warnings} = e as ParserException;
				if (
					!(from === index || /^Unclosed (?:comment|string literal)$/u.test(message) && to === index)
					|| warnings?.length
				) {
					(e as Error).cause = {message: `\n${incomplete}`};
					throw e;
				}
			}
		});
	}
});

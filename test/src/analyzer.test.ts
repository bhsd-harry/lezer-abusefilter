import analyze from '../../analyzer/analyzer.js';
import {data, updateData} from '../../dist/tokens.js';
import dialect from '../../dist/dialect.test.js';
import tests from '../parserTests.json' with {type: 'json'};
import type {ParserException} from '../../analyzer/analyzer';

updateData(dialect);

describe('Analyzer Tests', () => {
	const re = /(?:[)\]'"]|(?<![\w.])[\w.]+)[^)\]'"\w.]*$/u;
	for (const {desc, code} of tests) {
		it(desc, () => {
			try {
				analyze(code, data);
			} catch (e) {
				if (!(e as ParserException).message.startsWith('Unused local ')) {
					(e as Error).cause = {message: `\n${code}`};
					throw e;
				}
			}

			const {index} = re.exec(code)!,
				incomplete = code.slice(0, index);
			try {
				analyze(incomplete, data);
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

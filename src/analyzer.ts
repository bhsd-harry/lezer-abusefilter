import {data} from './tokens.js';
import analyze from '../analyzer/analyzer.js';
import type {LintSource, Diagnostic} from '@codemirror/lint';
import type {ParserException} from '../analyzer/analyzer';

/**
 * Lint source derived from
 * {@link https://meta.wikimedia.org/wiki/User:Msz2001/AbuseFilter_analyzer AbuseFilter analyzer}.
 * @ignore
 */
export const analyzer: LintSource = ({state: {doc}}) => {
	try {
		analyze(doc.toString(), data);
	} catch (e) {
		const {from: f, warnings = []} = e as ParserException;
		if (f === undefined) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
			throw e;
		}
		return [...warnings, e as ParserException]
			.map(({from, to = from, message, severity = 'error'}): Diagnostic => ({
				from,
				to,
				severity,
				source: 'AbuseFilter analyzer',
				message,
			}));
	}
	return [];
};

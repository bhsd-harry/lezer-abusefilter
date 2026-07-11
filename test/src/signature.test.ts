import * as assert from 'assert';
import {describe, it} from '@bhsd/test-util/mocha';
import {updateHelp, renderHelp} from '../../dist/signature.js';
import {createState} from './util.js';
import type {SignatureHelp} from '../../dist/signature.js';

const updateTest = (code: string, pos: number, expected: SignatureHelp | undefined): void => {
	const state = createState(code);
	assert.deepStrictEqual(updateHelp(state, pos), expected);
};
const renderTest = (help: SignatureHelp, expected: string): void => {
	assert.strictEqual(renderHelp(help), expected);
};

describe('signature help update', () => {
	it('not in function call', () => {
		updateTest('1', 1, undefined);
		updateTest('length(1)', 9, undefined);
		updateTest('f()', 2, undefined);
		updateTest('length(length(1))', 16, undefined);
	});
	it('in function call', () => {
		updateTest('length(', 7, {
			f: 'length',
			signatures: [['string']],
			active: 0,
		});
		updateTest('length(1,', 9, {
			f: 'length',
			signatures: [['string']],
			active: 1,
		});
		updateTest('count(', 6, {
			f: 'count',
			signatures: [['needle', 'haystack']],
			active: 0,
		});
		updateTest('count(1,', 8, {
			f: 'count',
			signatures: [['needle', 'haystack']],
			active: 1,
		});
		updateTest('count(1,2,', 10, {
			f: 'count',
			signatures: [['needle', 'haystack']],
			active: 2,
		});
		updateTest('length(1 +', 10, {
			f: 'length',
			signatures: [['string']],
			active: 0,
		});
		updateTest('count(length(1) ', 16, {
			f: 'count',
			signatures: [['needle', 'haystack']],
			active: 0,
		});
	});
});

describe('signature help render', () => {
	renderTest({
		f: 'length',
		signatures: [['string']],
		active: 0,
	}, 'length(<b>string</b>)');
	renderTest({
		f: 'length',
		signatures: [['string']],
		active: 1,
	}, 'length(string)');
	renderTest({
		f: 'count',
		signatures: [['needle', 'haystack']],
		active: 0,
	}, 'count(<b>needle</b>, haystack)');
	renderTest({
		f: 'count',
		signatures: [['needle', 'haystack']],
		active: 1,
	}, 'count(needle, <b>haystack</b>)');
	renderTest({
		f: 'count',
		signatures: [['needle', 'haystack']],
		active: 2,
	}, 'count(needle, haystack)');
	renderTest({
		f: 'equals_to_any',
		signatures: [['haystack', 'needle1', 'needle2', '...']],
		active: 100,
	}, 'equals_to_any(haystack, needle1, needle2, <b>...</b>)');
});

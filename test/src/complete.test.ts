import * as assert from 'assert';
import {syntaxTree} from '@codemirror/language';
import {describe, it} from '@bhsd/test-util/mocha';
import {autocomplete} from '../../dist/complete.js';
import {createState} from './util.js';
import type {CompletionResult, CompletionContext} from '@codemirror/autocomplete';

const test = (code: string, pos: number, type: string, expected: CompletionResult | null): void => {
	const state = createState(code),
		node = syntaxTree(state).resolveInner(pos, -1);
	assert.strictEqual(node.name, type);
	if (expected) {
		expected.validFor = /^\w*$/u;
	}
	const result = autocomplete({state, pos} as CompletionContext);
	if (result) {
		const prefix = state.sliceDoc(node.from, pos);
		result.options = result.options.filter(({label}) => label.startsWith(prefix))
			.map(({info, ...option}) => option);
	}
	assert.deepStrictEqual(result, expected);
};

describe('autocomplete', () => {
	it('identifier', () => {
		test('tr := 1; true', 11, 'Bool', {
			from: 9,
			options: [
				{label: 'true', type: 'keyword'},
				{label: 'translate_source_text', type: 'constant'},
				{label: 'translate_target_language', type: 'constant'},
				{label: 'tr', type: 'variable'},
			],
		});
		test('nu := 1; null', 11, 'null', {
			from: 9,
			options: [
				{label: 'null', type: 'keyword'},
				{label: 'nu', type: 'variable'},
			],
		});
		test('1a := 1; 1', 10, 'Num', {
			from: 9,
			options: [{label: '1a', type: 'variable'}],
		});
		test('nu := 1; nu', 11, 'VarName', {
			from: 9,
			options: [
				{label: 'null', type: 'keyword'},
				{label: 'nu', type: 'variable'},
			],
		});
		test('all_links', 1, 'DeprecatedVar', {
			from: 0,
			options: [
				{label: 'account_name', type: 'constant'},
				{label: 'account_type', type: 'constant'},
				{label: 'action', type: 'constant'},
				{label: 'added_lines', type: 'constant'},
				{label: 'added_links', type: 'constant'},
				{label: 'added_lines_pst', type: 'constant'},
			],
		});
		test('old_text', 4, 'DisabledVar', {
			from: 0,
			options: [
				{label: 'old_size', type: 'constant'},
				{label: 'old_content_model', type: 'constant'},
				{label: 'old_wikitext', type: 'constant'},
				{label: 'old_links', type: 'constant'},
			],
		});
		test('edit_diff', 1, 'GlobalVar', {
			from: 0,
			options: [
				{label: 'edit_delta', type: 'constant'},
				{label: 'edit_diff', type: 'constant'},
				{label: 'edit_diff_pst', type: 'constant'},
				{label: 'equals_to_any', type: 'function'},
			],
		});
		test('equals_to_any(', 1, 'Func', {
			from: 0,
			options: [
				{label: 'edit_delta', type: 'constant'},
				{label: 'edit_diff', type: 'constant'},
				{label: 'edit_diff_pst', type: 'constant'},
				{label: 'equals_to_any', type: 'function'},
			],
		});
		test('e(', 1, 'Callee', {
			from: 0,
			options: [
				{label: 'edit_delta', type: 'constant'},
				{label: 'edit_diff', type: 'constant'},
				{label: 'edit_diff_pst', type: 'constant'},
				{label: 'equals_to_any', type: 'function'},
			],
		});
		test('ifs := 1; if', 12, 'if', {
			from: 10,
			options: [
				{label: 'if', type: 'keyword'},
				{label: 'ifs', type: 'variable'},
			],
		});
	});
	it('if-statement', () => {
		test('t := 1; if 1 then', 14, 'then', {
			from: 13,
			options: [{label: 'then', type: 'keyword'}],
		});
		test('t := 1; if 1 t', 14, '⚠', {
			from: 13,
			options: [{label: 'then', type: 'keyword'}],
		});
		test('e := 1; if 1 then 1 else', 21, 'else', {
			from: 20,
			options: [
				{label: 'else', type: 'keyword'},
				{label: 'end', type: 'keyword'},
			],
		});
		test('e := 1; if 1 then 1 e', 21, '⚠', {
			from: 20,
			options: [
				{label: 'else', type: 'keyword'},
				{label: 'end', type: 'keyword'},
			],
		});
		test('e := 1; if 1 then 1 else 1 end', 28, 'end', {
			from: 27,
			options: [{label: 'end', type: 'keyword'}],
		});
		test('e := 1; if 1 then 1 else 1 e', 28, '⚠', {
			from: 27,
			options: [{label: 'end', type: 'keyword'}],
		});
	});
	it('relation keyword', () => {
		test('1 in', 3, 'Rel', {
			from: 2,
			options: [
				{label: 'in', type: 'keyword'},
				{label: 'irlike', type: 'keyword'},
			],
		});
		test('1 i', 3, '⚠', {
			from: 2,
			options: [
				{label: 'in', type: 'keyword'},
				{label: 'irlike', type: 'keyword'},
			],
		});
	});
	it('other', () => {
		test('"', 1, 'String', null);
		test('/*', 2, 'Comment', null);
		test('(', 1, '(', null);
		test('(1)', 3, ')', null);
		test('[', 1, '[', null);
		test('[1]', 3, ']', null);
		test('a := 1;', 7, ';', null);
		test('[1,', 3, ',', null);
		test('1 ==', 3, 'CompareOp', null);
		test('1 +', 3, 'ArithOp', null);
		test('1 &', 3, 'BitOp', null);
		test('!', 1, 'LogicOp', null);
		test('a :=', 3, 'Equals', null);
	});
});

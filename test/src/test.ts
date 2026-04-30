import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import parse from './parser.js';
import tests from '../parserTests.json' with {type: 'json'};
import type {ObjNode} from './parser';

export interface Test {
	desc: string;
	code: string;
	parsed: ObjNode;
}

const files = fs.globSync('test/core/*.t'),
	json = path.resolve('test', 'parserTests.json'),
	results: Test[] = [];
describe('Parser Tests', () => {
	for (let i = 0; i < files.length; i++) {
		const file = files[i]!,
			desc = path.basename(file, '.t'),
			code = fs.readFileSync(file, 'utf8');
		it(desc, () => {
			const result: Test = {
				code,
				desc,
				parsed: parse(code),
			};
			results.push(result);
			assert.deepStrictEqual(result, tests[i]!, desc);
		});
	}
	after(() => {
		fs.writeFileSync(json, `${JSON.stringify(results, null, '\t')}\n`);
	});
});

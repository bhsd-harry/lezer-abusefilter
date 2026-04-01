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

const dir = path.join('test', 'core'),
	files = fs.readdirSync(dir).filter(f => f.endsWith('.t')),
	json = path.resolve('test', 'parserTests.json'),
	results: Test[] = [];
describe('Parser Tests', () => {
	for (let i = 0; i < files.length; i++) {
		const file = files[i]!,
			desc = file.slice(0, -2),
			code = fs.readFileSync(path.join(dir, file), 'utf8');
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

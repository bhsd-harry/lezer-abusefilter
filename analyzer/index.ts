import {Parser} from './Parser.js';
import {Tokenizer} from './Tokenizer.js';
import type {Dialect} from './analyzer';

export {conditionKeywords} from './Tokenizer.js';

export default (input: string, dialect: Dialect): void => {
	new Parser(dialect).parse(new Tokenizer(input, dialect.keywords).tokenize());
};

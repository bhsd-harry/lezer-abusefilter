import {Parser} from './Parser.js';
import {Tokenizer} from './Tokenizer.js';

export default (input: string): void => {
	new Parser().parse(new Tokenizer(input).tokenize());
};

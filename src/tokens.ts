import {ExternalTokenizer} from '@lezer/lr';
import {
	Callee,
	Func,
	VarName,
	DeprecatedVar,
	DisabledVar,
	GlobalVar,
	Num,
} from './parser.terms.js';
import type {InputStream} from '@lezer/lr';

export interface Dialect {
	functions?: string[];
	variables?: string[];
	deprecated?: string[];
	disabled?: string[];
}

export const data: Required<Dialect> = {
	functions: [],
	variables: [],
	deprecated: [],
	disabled: [],
};

const ch = {
	Space: 32,
	Underscore: 95,
	Dot: 46,
	LPar: 40,
	A: 65,
	Z: 90,
	a: 97,
	z: 122,
	0: 48,
	9: 57,
};

const isSpace = (code: number): boolean => code === ch.Space || code >= 9 && code <= 13;

const isNum = (code: number): boolean => code >= ch[0] && code <= ch[9];

const isAlphaNum = (code: number): boolean => code === ch.Underscore
	|| isNum(code)
	|| code >= ch.A && code <= ch.Z
	|| code >= ch.a && code <= ch.z;

const eat = (input: InputStream, predicate: (code: number) => boolean): string => {
	let word = '';
	while (predicate(input.next)) {
		word += String.fromCodePoint(input.next);
		input.advance();
	}
	return word;
};

// 16-, 8-, 2-base integers and decimal numbers
const reNum = /^(?:0x[\dA-Fa-f]+|0o[0-7]+|0b[01]+|\d+(?:\.\d*)?|\.\d+)$/u,
	keywords = new Set(['true', 'false', 'null', 'if']);

export const tokens = new ExternalTokenizer(input => {
	let word = eat(input, isAlphaNum);
	const hasDot = input.next === ch.Dot;
	if (hasDot) {
		word += '.';
		input.advance();
		word += eat(input, isNum);
	}
	if (keywords.has(word)) {
		//
	} else if (reNum.test(word)) {
		input.acceptToken(Num);
	} else if (!hasDot && word) {
		// variable name may start with digit
		let offset = 0;
		while (isSpace(input.next)) {
			offset--;
			input.advance();
		}
		// There may be spaces between function name and "("
		if (input.next === ch.LPar) {
			input.acceptToken(data.functions.includes(word) ? Func : Callee, offset);
		} else if (data.disabled.includes(word)) {
			input.acceptToken(DisabledVar, offset);
		} else if (data.deprecated.includes(word)) {
			input.acceptToken(DeprecatedVar, offset);
		} else {
			input.acceptToken(data.variables.includes(word) ? GlobalVar : VarName, offset);
		}
	}
});

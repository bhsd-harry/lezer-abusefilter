import {LRLanguage, LanguageSupport} from '@codemirror/language';
import {styleTags, tags} from '@lezer/highlight';
import {parser} from './parser.js';
import {data} from './tokens.js';
import type {Dialect} from './tokens';

export const abusefilterLanguage = LRLanguage.define({
	name: 'abusefilter',
	parser: parser.configure({
		props: [
			styleTags({
				String: tags.string,
				Comment: tags.comment,
				Bool: tags.bool,
				null: tags.null,
				'else end if then': tags.controlKeyword,
				Rel: tags.operatorKeyword,
				Callee: tags.invalid,
				Func: tags.definition(tags.variableName),
				GlobalVar: tags.local(tags.variableName),
				DeprecatedVar: [tags.local(tags.variableName), tags.strikethrough],
				DisabledVar: tags.invalid,
				'; ,': tags.separator,
				'( )': tags.paren,
				'[ ]': tags.squareBracket,
				CompareOp: tags.compareOperator,
				ArithOp: tags.arithmeticOperator,
				BitOp: tags.logicOperator,
				LogicOp: tags.logicOperator,
				Equals: tags.updateOperator,
				Number: tags.number,
			}),
		],
	}),
	languageData: {
		commentTokens: {
			block: {open: '/*', close: '*/'},
		},
	},
});

export const abusefilter = (dialect?: Dialect): LanguageSupport => {
	if (dialect) {
		Object.assign(data, dialect);
	}
	return new LanguageSupport(abusefilterLanguage);
};

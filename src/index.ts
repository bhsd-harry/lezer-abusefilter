import {
	LRLanguage,
	LanguageSupport,
	foldNodeProp,
	foldInside,
	indentNodeProp,
	delimitedIndent,
	continuedIndent,
} from '@codemirror/language';
import {styleTags, tags} from '@lezer/highlight';
import {parser} from './parser.js';
import {updateData} from './tokens.js';
import {autocomplete} from './complete.js';
import {getHoverTooltip, getDefaultHoverTooltip} from './hover.js';
import type {Dialect} from '../analyzer/analyzer';

export {analyzer} from './analyzer.js';
export {getHoverTooltip, getDefaultHoverTooltip};
export type {Dialect};

/** LR language for AbuseFilter. */
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
				Num: tags.number,
			}),
			indentNodeProp.add({
				ArrayExpression: delimitedIndent({closing: ']'}),
				'ParenthesizedExpression ArgList': delimitedIndent({closing: ')'}),
				IfStatement: continuedIndent({except: /^\s*(?:then|else|end)\b/u}),
			}),
			foldNodeProp.add({
				'ArrayExpression ParenthesizedExpression': foldInside,
				Comment({from, to}) {
					return {from: from + 2, to: to - 2};
				},
				IfStatement(node) {
					const then = node.getChild('then'),
						end = node.getChild('end');
					return then && {from: then.to, to: end ? end.from : node.to};
				},
			}),
		],
	}),
	languageData: {
		commentTokens: {
			block: {open: '/*', close: '*/'},
		},
		closeBrackets: {
			brackts: ['(', '[', "'", '"'],
			before: ')];',
		},
		indentOnInput: /^\s*(?:[)\]]|then|else|end)$/u,
	},
});

/**
 * Get language support for AbuseFilter.
 * An optional argument can be used to provide information about built-in keywords, variables and functions.
 * @param dialect Site-specific information about built-in keywords, variables and functions
 */
export const abusefilter = (dialect?: Dialect): LanguageSupport => {
	updateData(dialect);
	return new LanguageSupport(abusefilterLanguage, [
		abusefilterLanguage.data.of({autocomplete}),
		getHoverTooltip(),
	]);
};

import {
	LRLanguage,
	LanguageSupport,
	foldNodeProp,
	foldInside,
	indentNodeProp,
	delimitedIndent,
	continuedIndent,
	syntaxTree,
} from '@codemirror/language';
import {styleTags, tags} from '@lezer/highlight';
import {parser} from './parser.js';
import {data} from './tokens.js';
import type {Text} from '@codemirror/state'; // eslint-disable-line @typescript-eslint/no-shadow
import type {CompletionContext, CompletionResult, Completion} from '@codemirror/autocomplete';
import type {SyntaxNode} from '@lezer/common';
import type {Dialect} from './tokens';

export type {Dialect};

const getVarAndFunc = (): Completion[] => [
	...data.variables.map((label): Completion => ({label, type: 'constant'})),
	...data.functions.map((label): Completion => ({label, type: 'function'})),
];
const getKeywords = (words: string[]): Completion[] => words.map((label): Completion => ({label, type: 'keyword'}));
const constants = getKeywords(['true', 'false', 'null', 'if']),
	relations = getKeywords(['in', 'like', 'matches', 'contains', 'rlike', 'regex', 'irlike']),
	keywords = new Set(['if', 'then', 'else']);

const cache = new WeakMap<SyntaxNode, Set<string>>();
const getScope = (doc: Text, scope: SyntaxNode): Set<string> => {
	if (cache.has(scope)) {
		return cache.get(scope)!;
	}
	const completions = new Set<string>();
	scope.cursor().iterate(node => { // eslint-disable-line consistent-return
		if (node.name === 'AssignmentExpression') {
			const variable = node.node.getChild('VarName');
			if (variable) {
				completions.add(doc.sliceString(variable.from, variable.to));
			}
			return false;
		} else if (node.to - node.from > 8192) {
			// Allow caching for bigger internal nodes
			for (const variable of getScope(doc, node.node)) {
				completions.add(variable);
			}
			return false;
		}
	});
	cache.set(scope, completions);
	return completions;
};

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

export const abusefilter = (dialect?: Dialect): LanguageSupport => {
	if (dialect) {
		Object.assign(data, dialect);
	}
	return new LanguageSupport(abusefilterLanguage, abusefilterLanguage.data.of({
		autocomplete({state, pos}: CompletionContext): CompletionResult | null {
			const tree = syntaxTree(state),
				inner = tree.resolveInner(pos, -1);
			switch (inner.name) {
				case 'Bool':
				case 'null':
				case 'Num':
				case 'VarName':
				case 'DeprecatedVar':
				case 'DisabledVar':
				case 'GlobalVar':
				case 'Func':
				case 'Callee':
					return {
						from: inner.from,
						options: [
							...constants,
							...getVarAndFunc(),
							...[...getScope(state.doc, tree.topNode)].map((label): Completion => ({
								label,
								type: 'variable',
							})),
						],
						validFor: /^\w*$/u,
					};
				case 'Rel':
				case '⚠': {
					let controls: Completion[] = [];
					if (inner.parent?.name === 'IfStatement') {
						let {prevSibling} = inner;
						while (prevSibling && !keywords.has(prevSibling.name)) {
							({prevSibling} = prevSibling);
						}
						switch (prevSibling?.name) {
							case 'if':
								controls = getKeywords(['then']);
								break;
							case 'then':
								controls = getKeywords(['else', 'end']);
								break;
							case 'else':
								controls = getKeywords(['end']);
							// no default
						}
					}
					return {
						from: inner.from,
						options: [...controls, ...relations],
						validFor: /^\w*$/u,
					};
				}
				default:
					return null;
			}
		},
	}));
};

import {syntaxTree} from '@codemirror/language';
import {data, startKeywords} from './tokens.js';
import type {Text} from '@codemirror/state'; // eslint-disable-line @typescript-eslint/no-shadow
import type {CompletionContext, CompletionResult, Completion} from '@codemirror/autocomplete';
import type {SyntaxNode} from '@lezer/common';

const getCompletionWithInfo = (words: string[], type: string, withInfo = true): Completion[] =>
	words.map((label): Completion => {
		const info = withInfo && data.hoverInfo.get(label);
		return {label, type, ...info && {info}};
	});
const getVarAndFunc = (): Completion[] => [
	...getCompletionWithInfo(data.variables, 'constant'),
	...getCompletionWithInfo(data.functions, 'function'),
];
const getKeywords = (words: string[]): Completion[] => getCompletionWithInfo(words, 'keyword');
const constants = getKeywords([...startKeywords]),
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

export const autocomplete = ({state, pos}: CompletionContext): CompletionResult | null => {
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
					...getCompletionWithInfo([...getScope(state.doc, tree.topNode)], 'variable', false),
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
				options: [
					...controls,
					...getKeywords(data.keywords),
				],
				validFor: /^\w*$/u,
			};
		}
		default:
			return null;
	}
};

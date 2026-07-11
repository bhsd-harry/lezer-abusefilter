import {syntaxTree} from '@codemirror/language';
import {escHTML} from '@bhsd/browser';
import {getSignatureHelpExtension} from '@bhsd/cm-util/cm';
import {data, updateData} from './tokens.js';
import {unique, defaultHoverInfo} from './util.js';
import type {Extension, EditorState} from '@codemirror/state';
import type {SyntaxNode} from '@lezer/common';

export interface SignatureHelp {
	f: string;
	signatures: string[][];
	active: number;
}

export const updateHelp = (state: EditorState, cursor: number): SignatureHelp | undefined => {
	const {hoverInfo} = data;
	if (hoverInfo.size === 0) {
		return undefined;
	}
	let node: SyntaxNode | null = syntaxTree(state).resolveInner(cursor, -1);
	if (node.name === ')') {
		return undefined;
	}
	while (node && node.name !== 'ArgList') {
		node = node.parent;
	}
	if (!node) {
		return undefined;
	}
	const previous = node.prevSibling;
	if (previous?.name !== 'Func') {
		return undefined;
	}
	const f = state.sliceDoc(previous.from, previous.to),
		info = hoverInfo.get(f);
	if (!info) {
		return undefined;
	}
	const i = info.search(new RegExp(String.raw`\b${f}\(`, 'u')),
		j = info.indexOf(')', i);
	if (i === -1 || j === -1) {
		return undefined;
	}
	let active = 0;
	for (let child = node.firstChild; child && child.to <= cursor; child = child.nextSibling) {
		if (child.name === ',') {
			active++;
		}
	}
	return {
		f,
		signatures: [info.slice(i + f.length + 1, j).split(',').map(s => s.trim())],
		active,
	};
};

export const renderHelp = ({f, signatures, active}: SignatureHelp): string => {
	const signature = signatures[0]!,
		l = signature.length;
	return `${f}(${
		signatures[0]!.map((s, i) => {
			const str = escHTML(s);
			return i === active || i === l - 1 && active > i && /^\.{2,}$/u.test(s) ? `<b>${str}</b>` : str;
		}).join(', ')
	})`;
};

const signatureFacet = unique(facet => getSignatureHelpExtension<SignatureHelp>({
	className: facet,
	render: renderHelp,
	update(_, state, {cursor}) {
		return updateHelp(state, cursor);
	},
}));

/**
 * Get signature help extension for AbuseFilter.
 * @param hoverInfo Map of built-in keywords, variables and functions to their descriptions
 * @param className Optional class name for the tooltip DOM element
 */
export const getSignatureHelp = (hoverInfo?: Map<string, string>, className = ''): Extension => {
	if (hoverInfo) {
		updateData({hoverInfo});
	}
	return signatureFacet.of(className);
};

/**
 * Get signature help extension for AbuseFilter with preset information about built-in functions.
 * @param className Optional class name for the tooltip DOM element
 */
export const getDefaultSignatureHelp = (className?: string): Extension => getSignatureHelp(defaultHoverInfo, className);

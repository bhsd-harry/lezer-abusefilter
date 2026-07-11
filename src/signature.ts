import {syntaxTree} from '@codemirror/language';
import {escHTML} from '@bhsd/browser';
import {getSignatureHelpExtension} from '@bhsd/cm-util/cm';
import {data} from './tokens.js';
import {unique} from './util.js';
import type {Extension} from '@codemirror/state';
import type {SyntaxNode} from '@lezer/common';

declare interface SignatureHelp {
	f: string;
	signatures: string[][];
	active: number;
}

const signatureFacet = unique(facet => getSignatureHelpExtension<SignatureHelp>({
	className: facet,
	update(_, state, {cursor}) {
		const {hoverInfo} = data;
		if (hoverInfo.size === 0) {
			return undefined;
		}
		let node: SyntaxNode | null = syntaxTree(state).resolve(cursor, 0);
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
	},
	render({f, signatures, active}) {
		return `${f}(${
			signatures[0]!.map((s, i) => {
				const str = escHTML(s);
				return i === active ? `<b>${str}</b>` : str;
			}).join(', ')
		})`;
	},
}));

export const getSignatureHelp = (className = ''): Extension => signatureFacet.of(className);

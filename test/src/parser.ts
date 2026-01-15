import {abusefilterLanguage} from '../../dist/index';
import {data} from '../../dist/tokens';
import dialect from '../../dist/dialect.test';
import type {SyntaxNode} from '@lezer/common';

export interface ObjNode {
	name: string;
	text?: string;
	children?: ObjNode[];
}

Object.assign(data, dialect);

const {parser} = abusefilterLanguage;

// eslint-disable-next-line @typescript-eslint/no-shadow
const toObj = (code: string, {name, from, to, firstChild}: SyntaxNode): ObjNode => {
	const node: ObjNode = {
		name,
		text: code.slice(from, to),
		children: [],
	};
	if (firstChild) {
		let child: SyntaxNode | null = firstChild;
		while (child) {
			if (child.from < child.to) {
				const childNode = toObj(code, child);
				if (name === 'BinaryExpression' && child.name === 'BinaryExpression') {
					let {nextSibling} = child;
					while (nextSibling && nextSibling.name === 'Comment') {
						({nextSibling} = nextSibling);
					}
					let nextChild: SyntaxNode | null = child.firstChild,
						first = true;
					while (nextChild && (first || nextChild.name === 'Comment')) {
						if (nextChild.name !== 'Comment') {
							first = false;
						}
						nextChild = nextChild.nextSibling;
					}
					if (
						nextSibling?.name === 'BitOp' && nextChild!.name === 'BitOp'
						|| nextSibling?.name === 'ArithOp' && nextChild!.name === 'ArithOp'
					) {
						node.children!.push(...childNode.children!);
						child = child.nextSibling;
						continue;
					}
				}
				node.children!.push(childNode);
			}
			child = child.nextSibling;
		}
	} else {
		delete node.children;
	}
	return node.children?.length === 1 ? node.children[0]! : node;
};

export default (code: string): ObjNode => {
	const node = toObj(code, parser.parse(code).topNode);
	delete node.text;
	return node;
};

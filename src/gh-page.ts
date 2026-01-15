import {EditorView, lineNumbers, highlightActiveLineGutter, keymap} from '@codemirror/view';
import {syntaxHighlighting, defaultHighlightStyle, syntaxTree} from '@codemirror/language';
import {defaultKeymap, history as historyExtension, historyKeymap, indentWithTab} from '@codemirror/commands';
// import {autocompletion} from '@codemirror/autocomplete';
import {searchKeymap} from '@codemirror/search';
import {abusefilter} from './index';
import dialect from './dialect.test';

const container = document.getElementById('wpTextbox')!,
	extensions = [
		abusefilter(dialect),
		syntaxHighlighting(defaultHighlightStyle),
		// autocompletion(),
		EditorView.lineWrapping,
		lineNumbers(),
		highlightActiveLineGutter(),
		keymap.of([
			...defaultKeymap,
			...searchKeymap,
			...historyKeymap,
			indentWithTab,
		]),
		historyExtension(),
	],
	view = new EditorView({parent: container, extensions});
Object.assign(globalThis, {view, syntaxTree}); // eslint-disable-line es-x/no-global-this

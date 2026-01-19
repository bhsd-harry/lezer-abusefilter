import {EditorView, lineNumbers, highlightActiveLineGutter, keymap} from '@codemirror/view';
import {
	syntaxHighlighting,
	defaultHighlightStyle,
	syntaxTree,
	bracketMatching,
	foldGutter,
	indentOnInput,
} from '@codemirror/language';
import {defaultKeymap, history as historyExtension, historyKeymap, indentWithTab} from '@codemirror/commands';
import {closeBrackets, autocompletion, acceptCompletion} from '@codemirror/autocomplete';
import {searchKeymap} from '@codemirror/search';
import {linter, lintGutter} from '@codemirror/lint';
import {abusefilter, analyzer} from './index';
import dialect from './dialect.test';

const container = document.getElementById('wpTextbox')!,
	extensions = [
		abusefilter(dialect),
		syntaxHighlighting(defaultHighlightStyle),
		bracketMatching({brackets: '()[]'}),
		closeBrackets(),
		autocompletion(),
		foldGutter(),
		linter(analyzer),
		lintGutter(),
		indentOnInput(),
		EditorView.lineWrapping,
		lineNumbers(),
		highlightActiveLineGutter(),
		keymap.of([
			...defaultKeymap,
			...searchKeymap,
			...historyKeymap,
			{key: 'Tab', run: acceptCompletion},
			indentWithTab,
		]),
		historyExtension(),
	],
	view = new EditorView({parent: container, extensions});
Object.assign(globalThis, {view, syntaxTree}); // eslint-disable-line es-x/no-global-this

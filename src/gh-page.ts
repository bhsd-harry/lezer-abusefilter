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
import {abusefilter, analyzer, getDefaultHoverTooltip} from './index';
import {data} from './tokens';
import dialect from './dialect.test';

const container = document.getElementById('wpTextbox')!,
	extensions = [
		abusefilter(dialect),
		linter(analyzer),
		getDefaultHoverTooltip(),
		syntaxHighlighting(defaultHighlightStyle),
		bracketMatching({brackets: '()[]'}),
		closeBrackets(),
		autocompletion(),
		foldGutter(),
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
Object.assign(globalThis, {view, syntaxTree, data}); // eslint-disable-line es-x/no-global-this

import {EditorState} from '@codemirror/state';
import {abusefilterLanguage} from '../../dist/index.js';
import {updateData} from '../../dist/tokens.js';
import {defaultHoverInfo} from '../../dist/util.js';
import dialect from './dialect.js';

updateData({...dialect, hoverInfo: defaultHoverInfo});

export const createState = (doc: string): EditorState => EditorState.create({
	doc,
	extensions: [abusefilterLanguage],
});

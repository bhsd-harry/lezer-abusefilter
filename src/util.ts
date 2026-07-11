import {Facet} from '@codemirror/state';
import type {Extension} from '@codemirror/state';

export const unique = (enables: (self: Facet<string, string>) => Extension): Facet<string, string> =>
	Facet.define<string, string>({
		combine(values) {
			return values[values.length - 1] || '';
		},
		enables,
	});

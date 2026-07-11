import {hoverTooltip} from '@codemirror/view';
import {syntaxTree} from '@codemirror/language';
import {createTooltipView} from '@bhsd/cm-util/cm';
import {data, updateData} from './tokens.js';
import {unique, defaultHoverInfo} from './util.js';
import type {Tooltip, TooltipView} from '@codemirror/view';
import type {Extension} from '@codemirror/state';

const hoverTokens = new Set(['VarName', 'GlobalVar', 'Func', 'Rel']),
	hoverFacet = unique(facet => hoverTooltip((view, pos, side): Tooltip | null => {
		const {hoverInfo} = data;
		if (hoverInfo.size === 0) {
			return null;
		}
		const {state} = view,
			{name: n, from, to} = syntaxTree(state).resolveInner(pos, side);
		if (!hoverTokens.has(n)) {
			return null;
		}
		const info = hoverInfo.get(state.sliceDoc(from, to));
		return info
			? {
				pos,
				end: to,
				above: true,
				create(): TooltipView {
					return createTooltipView(view, info, state.facet(facet), true);
				},
			}
			: null;
	}));

/**
 * Get hover tooltip extension for AbuseFilter.
 * @param hoverInfo Map of built-in keywords, variables and functions to their descriptions
 * @param className Optional class name for the tooltip DOM element
 */
export const getHoverTooltip = (hoverInfo?: Map<string, string>, className = ''): Extension => {
	if (hoverInfo) {
		updateData({hoverInfo});
	}
	return hoverFacet.of(className);
};

/**
 * Get hover tooltip extension for AbuseFilter with preset information about built-in keywords, variables and functions.
 * @param className Optional class name for the tooltip DOM element
 */
export const getDefaultHoverTooltip = (className?: string): Extension => getHoverTooltip(defaultHoverInfo, className);

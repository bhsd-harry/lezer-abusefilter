import {hoverTooltip} from '@codemirror/view';
import {syntaxTree} from '@codemirror/language';
import {Facet} from '@codemirror/state';
import {createTooltipView} from '@bhsd/cm-util/cm';
import {data, updateData} from './tokens.js';
import type {Tooltip, TooltipView} from '@codemirror/view';
import type {Extension} from '@codemirror/state';

const hoverTokens = new Set(['VarName', 'GlobalVar', 'Func', 'Rel']),
	hoverFacet = Facet.define<string, string>({
		combine(values) {
			return values[values.length - 1] || '';
		},
		enables(facet) {
			return hoverTooltip((view, pos, side): Tooltip | null => {
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
			});
		},
	});

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

const hoverInfo = new Map([
	[
		'in',
		'contained in string',
	],
	[
		'contains',
		'Left string contains right string',
	],
	[
		'like',
		'Matches pattern',
	],
	[
		'rlike',
		'Matches regex',
	],
	[
		'irlike',
		'Matches regex, case-insensitive',
	],
	[
		'length',
		'String length (length(string))',
	],
	[
		'lcase',
		'To lowercase (lcase(string))',
	],
	[
		'ucase',
		'To uppercase (ucase(string))',
	],
	[
		'ccnorm',
		'Normalize confusable characters (ccnorm(string))',
	],
	[
		'ccnorm_contains_any',
		'Normalize and search a string for multiple substrings in OR mode'
		+ ' (ccnorm_contains_any(haystack,needle1,needle2,..))',
	],
	[
		'ccnorm_contains_all',
		'Normalize and search a string for multiple substrings in AND mode'
		+ ' (ccnorm_contains_all(haystack,needle1,needle2,..))',
	],
	[
		'rmdoubles',
		'Remove double-characters (rmdoubles(string))',
	],
	[
		'specialratio',
		'Special characters / total characters (specialratio(string))',
	],
	[
		'norm',
		'Normalize (norm(string))',
	],
	[
		'count',
		'Number of times string X appears in string Y (count(needle,haystack))',
	],
	[
		'rcount',
		'Number of times regex X appears in string Y (rcount(needle,haystack))',
	],
	[
		'get_matches',
		'Array of regex matches within a text for each capturing group (get_matches(needle,haystack))',
	],
	[
		'rmwhitespace',
		'Remove whitespace (rmwhitespace(text))',
	],
	[
		'rmspecials',
		'Remove special characters (rmspecials(text))',
	],
	[
		'ip_in_range',
		'Is IP in range? (ip_in_range(ip, range))',
	],
	[
		'ip_in_ranges',
		'Is IP in any of the ranges? (ip_in_ranges(ip, range1, range2, ...))',
	],
	[
		'contains_any',
		'Search string for multiple substrings in OR mode (contains_any(haystack,needle1,needle2,...))',
	],
	[
		'contains_all',
		'Search string for multiple substrings in AND mode (contains_all(haystack,needle1,needle2,...))',
	],
	[
		'equals_to_any',
		'Check if a given argument is equal (===) to any of the following arguments'
		+ ' (equals_to_any(haystack,needle1,needle2,...))',
	],
	[
		'substr',
		'Substring (substr(subject, offset, length))',
	],
	[
		'strpos',
		'Position of substring in string (strpos(haystack, needle))',
	],
	[
		'str_replace',
		'Replace substring with string (str_replace(subject, search, replace))',
	],
	[
		'str_replace_regexp',
		'Regular expression search and replace (str_replace_regexp(subject, search, replace))',
	],
	[
		'rescape',
		'Escape string as literal in regex (rescape(string))',
	],
	[
		'set_var',
		'Set variable (set_var(var,value))',
	],
	[
		'sanitize',
		'Normalize HTML entities into unicode characters (sanitize(string))',
	],
	[
		'timestamp',
		'Unix timestamp of change',
	],
	[
		'account_name',
		'Account name on account creation',
	],
	[
		'account_type',
		'Account type on account creation',
	],
	[
		'action',
		'Action',
	],
	[
		'added_lines',
		'Lines added in edit',
	],
	[
		'edit_delta',
		'Size change in edit',
	],
	[
		'edit_diff',
		'Unified diff of changes made by edit',
	],
	[
		'new_size',
		'New page size',
	],
	[
		'old_size',
		'Old page size',
	],
	[
		'new_content_model',
		'New content model',
	],
	[
		'old_content_model',
		'Old content model',
	],
	[
		'removed_lines',
		'Lines removed in edit',
	],
	[
		'summary',
		'Edit summary/reason',
	],
	[
		'page_id',
		'Page ID',
	],
	[
		'page_namespace',
		'Page namespace',
	],
	[
		'page_title',
		'Page title without namespace',
	],
	[
		'page_prefixedtitle',
		'Full page title',
	],
	[
		'page_age',
		'Page age in seconds',
	],
	[
		'page_last_edit_age',
		'Time since last page edit in seconds',
	],
	[
		'moved_from_id',
		'Page ID of move source page',
	],
	[
		'moved_from_namespace',
		'Namespace of move source page',
	],
	[
		'moved_from_title',
		'Title of move source page',
	],
	[
		'moved_from_prefixedtitle',
		'Full title of move source page',
	],
	[
		'moved_from_age',
		'Move source page age in seconds',
	],
	[
		'moved_from_last_edit_age',
		'Time since last move source page edit in seconds',
	],
	[
		'moved_to_id',
		'Page ID of move destination page',
	],
	[
		'moved_to_namespace',
		'Namespace of move destination page',
	],
	[
		'moved_to_title',
		'Title of move destination page',
	],
	[
		'moved_to_prefixedtitle',
		'Full title of move destination page',
	],
	[
		'moved_to_age',
		'Move destination page age in seconds',
	],
	[
		'moved_to_last_edit_age',
		'Time since last move destination page edit in seconds',
	],
	[
		'user_editcount',
		'Edit count of the user',
	],
	[
		'user_age',
		'Age of the user account',
	],
	[
		'user_unnamed_ip',
		'IP of the user account (for logged-out users and temporary accounts only)',
	],
	[
		'user_name',
		'Name of the user account',
	],
	[
		'user_type',
		'Type of the user account',
	],
	[
		'user_groups',
		'Groups (including implicit) the user is in',
	],
	[
		'user_rights',
		'Rights that the user has',
	],
	[
		'user_blocked',
		'Whether the user is blocked',
	],
	[
		'user_emailconfirm',
		'Time email address was confirmed',
	],
	[
		'old_wikitext',
		'Old page wikitext, before the edit',
	],
	[
		'new_wikitext',
		'New page wikitext, after the edit',
	],
	[
		'added_links',
		'External links added in the edit',
	],
	[
		'removed_links',
		'External links removed in the edit',
	],
	[
		'old_links',
		'External links in the page, before the edit',
	],
	[
		'new_links',
		'External links in the new text',
	],
	[
		'new_pst',
		'New page wikitext, pre-save transformed',
	],
	[
		'edit_diff_pst',
		'Unified diff of changes made by edit, pre-save transformed',
	],
	[
		'added_lines_pst',
		'Lines added in edit, pre-save transformed',
	],
	[
		'new_text',
		'New page text, stripped of any markup',
	],
	[
		'new_html',
		'Parsed HTML source of the new revision',
	],
	[
		'page_restrictions_edit',
		'Edit protection level of the page',
	],
	[
		'page_restrictions_move',
		'Move protection level of the page',
	],
	[
		'page_restrictions_create',
		'Create protection of the page',
	],
	[
		'page_restrictions_upload',
		'Upload protection of the file',
	],
	[
		'page_recent_contributors',
		'Last ten users to contribute to the page',
	],
	[
		'page_first_contributor',
		'First user to contribute to the page',
	],
	[
		'moved_from_restrictions_edit',
		'Edit protection level of move source page',
	],
	[
		'moved_from_restrictions_move',
		'Move protection level of move source page',
	],
	[
		'moved_from_restrictions_create',
		'Create protection of move source page',
	],
	[
		'moved_from_restrictions_upload',
		'Upload protection of move source file',
	],
	[
		'moved_from_recent_contributors',
		'Last ten users to contribute to move source page',
	],
	[
		'moved_from_first_contributor',
		'First user to contribute to move source page',
	],
	[
		'moved_to_restrictions_edit',
		'Edit protection level of move destination page',
	],
	[
		'moved_to_restrictions_move',
		'Move protection level of move destination page',
	],
	[
		'moved_to_restrictions_create',
		'Create protection of move destination page',
	],
	[
		'moved_to_restrictions_upload',
		'Upload protection of move destination file',
	],
	[
		'moved_to_recent_contributors',
		'Last ten users to contribute to move destination page',
	],
	[
		'moved_to_first_contributor',
		'First user to contribute to move destination page',
	],
	[
		'file_sha1',
		'SHA1 hash of file contents',
	],
	[
		'file_size',
		'Size of the file in bytes',
	],
	[
		'file_mime',
		'MIME type of the file',
	],
	[
		'file_mediatype',
		'Media type of the file',
	],
	[
		'file_width',
		'Width of the file in pixels',
	],
	[
		'file_height',
		'Height of the file in pixels',
	],
	[
		'file_bits_per_channel',
		'Bits per color channel of the file',
	],
	[
		'wiki_name',
		'Database name of the wiki',
	],
	[
		'wiki_language',
		'Language code of the wiki',
	],
]);

/**
 * Get hover tooltip extension for AbuseFilter with preset information about built-in keywords, variables and functions.
 * @param className Optional class name for the tooltip DOM element
 */
export const getDefaultHoverTooltip = (className?: string): Extension => getHoverTooltip(hoverInfo, className);

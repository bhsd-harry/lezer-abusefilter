import {LRLanguage, LanguageSupport} from '@codemirror/language';
import {styleTags, tags} from '@lezer/highlight';
import {parser} from '../src/parser';

export const abusefilterLanguage = LRLanguage.define({
	name: 'abusefilter',
	parser: parser.configure({
		props: [
			styleTags({
				'else end if then': tags.controlKeyword,
				'in like matches contains rlike regex irlike': tags.operatorKeyword,

				/**
				 * @todo Define dialects with a list of keywords
				 * @see https://github.com/codemirror/lang-sql/blob/main/src/sql.ts#L93
				 */
				// eslint-disable-next-line @stylistic/max-len
				'lcase ucase length string int float bool norm ccnorm ccnorm_contains_any ccnorm_contains_all specialratio rmspecials rmdoubles rmwhitespace count rcount get_matches ip_in_range ip_in_ranges contains_any contains_all equals_to_any substr strlen strpos str_replace str_replace_regexp rescape set set_var': tags.definition(tags.variableName),
				BooleanLiteral: tags.bool,
				null: tags.null,
				'; ,': tags.separator,
				'( )': tags.paren,
				'[ ]': tags.squareBracket,
				CompareOp: tags.compareOperator,
				ArithOp: tags.arithmeticOperator,
				BitOp: tags.logicOperator,
				LogicOp: tags.logicOperator,
				Equals: tags.updateOperator,
				BlockComment: tags.comment,
				Number: tags.number,
				String: tags.string,
			}),
		],
	}),
	languageData: {
		commentTokens: {
			block: {open: '/*', close: '*/'},
		},
	},
});

export const abusefilter = (): LanguageSupport => new LanguageSupport(abusefilterLanguage);

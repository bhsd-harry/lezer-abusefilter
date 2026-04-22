/** Site-specific information about built-in keywords, variables and functions for AbuseFilter. */
export interface Dialect {
	functions?: string[];
	variables?: string[];
	deprecated?: string[];
	disabled?: string[];
	keywords?: string[];
	hoverInfo?: Map<string, string>;
}

export const conditionKeywords: Set<string>;

declare const analyze: (filterText: string, dialect: Dialect) => void;
export default analyze;

export interface ParserException extends Error {
	from: number;
	to?: number | undefined;
	severity?: 'error' | 'warning' | undefined;
	warnings?: ParserException[] | undefined;
}

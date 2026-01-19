export interface Dialect {
	functions?: string[];
	variables?: string[];
	deprecated?: string[];
	disabled?: string[];
}

declare const analyze: (filterText: string, dialect: Dialect) => void;
export default analyze;

export interface ParserException extends Error {
	from: number;
	to?: number | undefined;
	severity?: 'error' | 'warning' | undefined;
	warnings?: ParserException[] | undefined;
}

declare const analyze: (filterText: string) => void;
export default analyze;

export interface ParserException extends Error {
	from: number;
	to?: number | undefined;
}

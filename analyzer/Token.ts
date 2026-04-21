import {TokenType} from './TokenType.js';

/**
 * Represents a token found in the input sequence.
 */
export class Token {
	/** A value for EndOfStream tokens. */
	public static readonly EOF = '';

	/** The position in the input sequence where this token ends. */
	declare public readonly end: number;

	/**
	 * @param type The token type.
	 * @param value The value of the token. For end of stream tokens, use Token.EOF.
	 * @param from The position in the input where this token starts.
	 */
	public constructor(public type: TokenType, public value: string, public start: number, len = value.length) {
		this.end = start + len;
		if (type === TokenType.EndOfStream) {
			this.value = Token.EOF;
		}
	}

	/**
	 * Convenience function for checking the token type and value.
	 * @param type The token type to check.
	 * @param value The token value to check. Can be a string, an array of strings or null.
	 * @returns True if type and value are equal. If value is an array, returns true if the token value is in the array.
	 */
	public is(type: TokenType, value?: string[] | string): boolean {
		if (this.type !== type) {
			return false;
		} else if (value === undefined) {
			return true;
		}
		return typeof value === 'string' ? this.value === value : value.includes(this.value);
	}
}

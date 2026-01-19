import {Token} from './Token.js';
import {TokenType} from './TokenType.js';
import {ParserException} from './ParserException.js';

/** Regular expression to find beginning of a comment after potentially some whitespaces. */
const commentStartRegex = /(\s*)\/\*/uy;

/** Regular expression to find operators. Ordered so that the longest will try to be matched first. */
const operatorsRegex = /[!=]={0,2}|[:<>]=?|\*{1,2}|[/+\-%&|^?]/uy;

/** Regular expression to match numbers in varying bases. */
const numberRegex = /0([xbo])([\dA-Fa-f]+)\b|(\d+(?:\.\d*)?|\.\d+)(?!\w)/uy;

/**
 * Regular expression to match identifiers and keywords. We allow for identifiers starting with digit,
 * they are however caught earlier when parsing numbers.
 */
const identifierRegex = /\w+/uy;

/** Characters to be ignored when between tokens. */
const whitespaces = new Set([' ', '\t', '\n', '\v', '\f', '\r']);

/** General mapping of puntuation characters into their respective token types. */
const punctuationTokens = new Map<string, TokenType>([
	['(', TokenType.Parenthesis],
	[')', TokenType.Parenthesis],
	['[', TokenType.SquareBracket],
	[']', TokenType.SquareBracket],
	[',', TokenType.Comma],
	[';', TokenType.StatementSeparator],
]);

/** Mapping of base characters to their respective numeric base. */
const numberBases = new Map<string, number>([
	['x', 16],
	['b', 2],
	['o', 8],
]);

/** List of relation keywords. */
export const relationKeywords = ['in', 'like', 'contains', 'matches', 'rlike', 'irlike', 'regex'],
	valueKeywords = new Set(['true', 'false', 'null']),
	conditionKeywords = new Set(['if', 'then', 'else', 'end']);

/** Set of keywords recognized by the tokenizer. */
const keywords = new Set([
	...relationKeywords,
	...valueKeywords,
	...conditionKeywords,
]);

/**
 * Essential class for AbuseFilter rule preparation before actual parsing.
 *
 * Converts the string representation of an expression into a sequence of tokens.
 *
 * Based on https://phabricator.wikimedia.org/diffusion/EABF/browse/master/includes/Parser/AbuseFilterTokenizer.php
 */
export class Tokenizer {
	private readonly length: number;

	/**
	 * @param input The input string to tokenize.
	 */
	public constructor(private input: string) {
		this.length = input.length;
	}

	/**
	 * Converts the input string into a sequence of tokens.
	 *
	 * @returns An array of tokens ending with EndOfStream token.
	 */
	public tokenize(): Token[] {
		const tokens = [] as Token[];

		// Initialize the token variable with a dummy token.
		// Its position will make our parser start at the beginning of the input.
		// The actual type is not important here, as the parser will replace it immediately.
		let token = {end: 0} as Token;
		do {
			token = this.getNextToken(token.end);
			tokens.push(token);
		} while (!token.is(TokenType.EndOfStream));
		return tokens;
	}

	/**
	 * Returns the next token from the input string.
	 *
	 * @param startOffset The position in the input string to start searching for the next token.
	 * @returns The next token in the input string.
	 */
	protected getNextToken(startOffset: number): Token {
		const {input, length: l} = this;
		let offset = startOffset;
		// Skip comments first. Don't treat them as tokens at all.
		commentStartRegex.lastIndex = offset;
		let commentStartMatch = commentStartRegex.exec(input);
		while (commentStartMatch) {
			// We found a comment start. Let's find the end of the comment.
			const commentEnd = input.indexOf('*/', commentStartRegex.lastIndex);
			if (commentEnd === -1) {
				throw new ParserException('Unclosed comment', offset + commentStartMatch[1]!.length, l);
			}
			offset = commentEnd + 2;
			commentStartRegex.lastIndex = offset;
			commentStartMatch = commentStartRegex.exec(input);
		}

		// Skip whitespaces.
		while (offset < l && whitespaces.has(input[offset]!)) {
			offset++;
		}

		// If we reached the end of the input, return the EOF token.
		// Any further rules will not adjust offset, so we can safely do the check here.
		if (offset >= l) {
			return new Token(TokenType.EndOfStream, Token.EOF, offset);
		}

		const firstChar = input[offset]!;

		// Punctuation
		const punctuationToken = punctuationTokens.get(firstChar);
		if (punctuationToken !== undefined) {
			return new Token(punctuationToken, firstChar, offset);
		}

		// String literals
		if (firstChar === '"' || firstChar === "'") {
			return this.readStringLiteral(offset);
		}

		// Operators
		operatorsRegex.lastIndex = offset;
		const operatorMatch = operatorsRegex.exec(input);
		if (operatorMatch) {
			return new Token(TokenType.Operator, operatorMatch[0], offset);
		}

		// Numbers
		numberRegex.lastIndex = offset;
		const numberMatch = numberRegex.exec(input);
		if (numberMatch) {
			const base = numberBases.get(numberMatch[1]!);
			const number = numberMatch[base ? 2 : 3]!;
			const tokenLength = numberMatch[0].length;

			// Checking for being NaN is needed, otherwise token `a` will be interpreted as
			// `0x0a` and not as an identifier
			if (number.includes('.')) {
				const numberValue = parseFloat(number);
				if (!isNaN(numberValue)) {
					return new Token(TokenType.FloatLiteral, String(numberValue), offset, tokenLength);
				}
			} else {
				const numberValue = parseInt(number, base);
				if (!isNaN(numberValue)) {
					return new Token(TokenType.IntLiteral, String(numberValue), offset, tokenLength);
				}
			}
		}

		// Identifiers and keywords
		identifierRegex.lastIndex = offset;
		const identifierMatch = identifierRegex.exec(input);
		if (identifierMatch) {
			let [identifier] = identifierMatch;
			const isKeyword = keywords.has(identifier);
			const tokenType = isKeyword ? TokenType.Keyword : TokenType.Identifier;
			if (!isKeyword) {
				identifier = identifier.toLowerCase();
			}
			return new Token(tokenType, identifier, offset);
		}

		throw new ParserException(`Unexpected character ${JSON.stringify(firstChar)}`, offset);
	}

	/**
	 * Reads a string literal from the input string.
	 *
	 * @param startOffset The position in the input string to start reading the string literal from.
	 * @returns The string literal token.
	 */
	protected readStringLiteral(startOffset: number): Token {
		const {input, length: l} = this;
		const quoteChar = input[startOffset]!;

		// Stores the parsed string content, i.e. `\n` will be stored as a newline character etc.
		let stringContent = '';
		let offset = startOffset + 1;
		while (offset < l) {
			const char = input[offset]!;
			if (char === quoteChar) {
				// The string ends here.
				// We calculate the token length by offsets in the input stream, because the string
				// content may not be the same length as the token in the input string
				// (eg. \n is two bytes in input).
				return new Token(TokenType.StringLiteral, stringContent, startOffset, offset - startOffset + 1);
			} else if (char === '\\') {
				if (offset + 1 >= l) {
					// Unmatched escape at the end of the string
					break;
				} else {
					const nextChar = input[offset + 1]!;
					let escapeSequenceLength = 2;
					switch (nextChar) {
						case '\\':
							stringContent += '\\';
							break;
						case 'n':
							stringContent += '\n';
							break;
						case 'r':
							stringContent += '\r';
							break;
						case 't':
							stringContent += '\t';
							break;
						case quoteChar:
							stringContent += quoteChar;
							break;
						case 'x':
							// Ensure that the full `\xAB` sequence fits in the input string
							if (offset + 3 < l) {
								const charCode = input.substring(offset + 2, offset + 4);
								if (/^[\da-f]{2}$/iu.test(charCode)) {
									stringContent += String.fromCharCode(parseInt(charCode, 16));
									escapeSequenceLength = 4;
									break;
								}
							}
							stringContent += String.raw`\x`;
							break;
						default:
							stringContent += `\\${nextChar}`;
							break;
					}
					offset += escapeSequenceLength;
				}
			} else {
				// Copy the whole chunk without escape characters to the output variable.
				// chunkEnd is the exclusive end of the chunk.
				const nextBackslash = input.indexOf('\\', offset);
				const nextQuote = input.indexOf(quoteChar, offset);
				let chunkEnd = l;
				if (nextBackslash !== -1) {
					chunkEnd = nextBackslash;
				}
				if (nextQuote !== -1) {
					chunkEnd = Math.min(chunkEnd, nextQuote);
				}
				const chunk = input.substring(offset, chunkEnd);
				stringContent += chunk;
				offset = chunkEnd;
			}
		}

		// If we reached the end of the input, the string is unclosed.
		throw new ParserException('Unclosed string literal', startOffset, l);
	}
}

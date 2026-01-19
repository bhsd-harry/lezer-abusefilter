import {ParserException} from './ParserException.js';
import {TokenType} from './TokenType.js';
import {relationKeywords, valueKeywords} from './Tokenizer.js';
import type {Token} from './Token.js';

const boolOps = ['&', '|', '^'],
	equalityOps = ['==', '===', '!=', '!==', '='],
	orderOps = ['<', '>', '<=', '>='],
	arithOps = ['+', '-', '*', '/', '%', '**'],
	unaryOps = ['+', '-'];

/**
 * A parser for the AbuseFilter syntax.
 * @param TNode The type of the nodes in the expression tree.
 *
 * Based on https://phabricator.wikimedia.org/diffusion/EABF/browse/master/includes/Parser/AFPTreeParser.php
 */
export class Parser {
	/** Stores the sequence of tokens that the parser is currently processing. */
	private tokens: readonly Token[];

	/** The current token */
	private current: Token;

	/** The position of the current token */
	private mPos: number;
	// TODO: It'd be better to use some Queue<Token> like structure to avoid using mPos and mCur

	/**
	 * Parses a list of AbuseFilter tokens into an expression tree.
	 *
	 * @param tokens The tokens to parse.
	 * @returns The parsed expression tree.
	 */
	public parse(tokens: readonly Token[]): void {
		this.tokens = tokens;
		this.mPos = -1; // -1 so that the first call to move() sets it to 0
		this.doLevelEntry();
	}

	/**
	 * Advances the parser to the next token in the filter code.
	 */
	private move(): void {
		this.mPos++;
		this.current = this.tokens[this.mPos]!;
	}

	/**
	 * getState() function allows parser state to be rollbacked to several tokens
	 * back.
	 *
	 * @returns AFPParserState
	 */
	private getState(): [Token, number] {
		return [this.current, this.mPos];
	}

	/**
	 * setState() function allows parser state to be rollbacked to several tokens
	 * back.
	 * TODO: This should not be needed at all
	 * @param AFPParserState state
	 * @param state
	 */
	private setState(state: [Token, number]): void {
		[this.current, this.mPos] = state;
	}

	/**
	 * Convenience function for checking the current token type and value.
	 * @param type The token type to check.
	 * @param value The token value to check. Can be a string, an array of strings or null.
	 * @returns True if type and value are equal. If value is an array, returns true if the token value is in the array.
	 */
	private is(type: TokenType, value?: string[] | string): boolean {
		return this.current.is(type, value);
	}

	/**
	 * Convenience function for checking the next token type and value.
	 * @param type The token type to check.
	 * @param value The token value to check. Can be a string, an array of strings or null.
	 * @returns True if type and value are equal. If value is an array, returns true if the token value is in the array.
	 */
	private nextIs(type: TokenType, value?: string[] | string): boolean {
		return this.tokens[this.mPos + 1]!.is(type, value);
	}

	/* Levels */

	/**
	 * Handles unexpected characters after the expression.
	 * @returns Null only if no statements
	 */
	private doLevelEntry(): void {
		this.doLevelSemicolon();

		// At the top level, the filter consists of a single expression.
		// Thus, the only legal token to be found later is the end of the stream.
		if (!this.is(TokenType.EndOfStream)) {
			this.throwUnexpectedToken();
		}
	}

	/** Handles the semicolon operator. */
	private doLevelSemicolon(): void {
		do {
			// At the first iteration it can be garbage but the variable is used only
			// if there are at least two statements. It's guaranteed to be set correctly then.
			this.move();

			if (this.is(TokenType.EndOfStream) || this.is(TokenType.Parenthesis, ')')) {
				// Handle special cases which the other parser handled in doLevelAtom
				return;
			}

			// Allow empty statements.
			if (this.is(TokenType.StatementSeparator)) {
				continue;
			}

			this.doLevelSet();
		} while (this.is(TokenType.StatementSeparator));
	}

	/** Handles variable assignment. */
	private doLevelSet(): void {
		if (this.is(TokenType.Identifier)) {
			// Speculatively parse the assignment statement assuming it can
			// potentially be an assignment, but roll back if it isn't.
			// @todo Use this.getNextToken for clearer code
			const initialState = this.getState();
			this.move();

			if (this.is(TokenType.Operator, ':=')) {
				this.move();
				this.doLevelSet();

				return;
			}

			if (this.is(TokenType.SquareBracket, '[')) {
				this.move();

				// Parse index offset.
				if (!this.is(TokenType.SquareBracket, ']')) {
					this.setState(initialState);
					this.move();
					this.doLevelSemicolon();
					if (!this.is(TokenType.SquareBracket, ']')) {
						this.throwExpectedNotFound(']');
					}
				}

				this.move();
				if (this.is(TokenType.Operator, ':=')) {
					this.move();
					this.doLevelSet();

					// TODO: index could be null, but the original parser acts this way
					return;
				}
			}

			// If we reached this point, we did not find an assignment. Roll back
			// and assume this was just a literal.
			this.setState(initialState);
		}

		this.doLevelConditions();
	}

	/** Handles ternary operator and if-then-else-end. */
	private doLevelConditions(): void {
		if (this.is(TokenType.Keyword, 'if')) {
			this.move();
			this.doLevelBoolOps();

			if (!this.is(TokenType.Keyword, 'then')) {
				this.throwExpectedNotFound('then');
			}
			this.move();

			this.doLevelConditions();

			if (this.is(TokenType.Keyword, 'else')) {
				this.move();

				this.doLevelConditions();
			}

			if (!this.is(TokenType.Keyword, 'end')) {
				this.throwExpectedNotFound('end');
			}
			this.move();

			return;
		}

		this.doLevelBoolOps();
		if (this.is(TokenType.Operator, '?')) {
			this.move();

			this.doLevelConditions();
			if (!this.is(TokenType.Operator, ':')) {
				this.throwExpectedNotFound(':');
			}
			this.move();

			this.doLevelConditions();
		}
	}

	/**
	 * Handles logic/arithmetic operators.
	 * @param ops The operators to handle.
	 * @param method The method to call for the next level.
	 */
	private doLevelBinaryOps(ops: string[], method: 'doLevelCompares' | 'doLevelBoolInvert'): void {
		this[method]();

		while (this.is(TokenType.Operator, ops)) {
			this.move();
			this[method]();
		}
	}

	/** Handles logic operators. */
	private doLevelBoolOps(): void {
		this.doLevelBinaryOps(boolOps, 'doLevelCompares');
	}

	/** Handles comparison operators. */
	private doLevelCompares(): void {
		this.doLevelArithRels();
		// Only allow either a single operation, or a combination of a single equalityOps and a single
		// orderOps. This resembles what PHP does, and allows `a < b == c` while rejecting `a < b < c`
		let allowedOps = [...equalityOps, ...orderOps];

		while (this.is(TokenType.Operator, allowedOps)) {
			const disallowedOps = equalityOps.includes(this.current.value) ? equalityOps : orderOps;
			allowedOps = allowedOps.filter(op => !disallowedOps.includes(op));

			this.move();
			this.doLevelArithRels();
		}
	}

	/** Handle arithmetic operators. */
	private doLevelArithRels(): void {
		this.doLevelBinaryOps(arithOps, 'doLevelBoolInvert');
	}

	/** Handles boolean inversion. */
	private doLevelBoolInvert(): void {
		if (this.is(TokenType.Operator, '!')) {
			this.move();
		}

		this.doLevelKeywordOperators();
	}

	/** Handles keyword operators. */
	private doLevelKeywordOperators(): void {
		this.doLevelUnarys();

		if (this.is(TokenType.Keyword, relationKeywords)) {
			this.move();
			this.doLevelUnarys();
		}
	}

	/** Handles unary operators. */
	private doLevelUnarys(): void {
		if (this.is(TokenType.Operator, unaryOps)) {
			this.move();
		}

		this.doLevelArrayElements();
	}

	/** Handles accessing an array element by an offset. */
	private doLevelArrayElements(): void {
		this.doLevelParenthesis();
		while (this.is(TokenType.SquareBracket, '[')) {
			this.doLevelSemicolon(); // TODO: index could be null, but the original parser acts this way

			if (!this.is(TokenType.SquareBracket, ']')) {
				this.throwExpectedNotFound(']');
			}
			this.move();
		}
	}

	/** Handles parenthesis. */
	private doLevelParenthesis(): void {
		if (this.is(TokenType.Parenthesis, '(')) {
			if (this.nextIs(TokenType.Parenthesis, ')')) {
				// Empty parentheses are never allowed
				this.move();
				this.throwUnexpectedToken();
			}
			// TODO: result could be null, but the original parser acts this way
			this.doLevelSemicolon();

			if (!this.is(TokenType.Parenthesis, ')')) {
				this.throwExpectedNotFound(')');
			}
			this.move();

			return;
		}

		this.doLevelFunction();
	}

	/** Handles function calls. */
	private doLevelFunction(): void {
		if (this.is(TokenType.Identifier) && this.nextIs(TokenType.Parenthesis, '(')) {
			this.move();

			if (this.nextIs(TokenType.Parenthesis, ')')) {
				this.move();
			} else {
				do {
					this.doLevelSemicolon();
				} while (this.is(TokenType.Comma));
				if (!this.is(TokenType.Parenthesis, ')')) {
					this.throwExpectedNotFound(')');
				}
			}

			this.move();

			return;
		}

		this.doLevelAtom();
	}

	/** Handle literals. */
	private doLevelAtom(): void {
		const {type, value} = this.current;
		switch (type) {
			case TokenType.Identifier:
			case TokenType.StringLiteral:
			case TokenType.FloatLiteral:
			case TokenType.IntLiteral:
				break;
			case TokenType.Keyword:
				if (valueKeywords.has(value)) {
					break;
				}

				this.throw('unrecognized');
				// no fall through

			case TokenType.SquareBracket:
				if (value === '[') {
					while (true) {
						this.move();
						if (this.is(TokenType.SquareBracket, ']')) {
							break;
						}

						this.doLevelSet();

						if (this.is(TokenType.SquareBracket, ']')) {
							break;
						}
						if (!this.is(TokenType.Comma)) {
							this.throwExpectedNotFound('," or "]');
						}
					}

					break;
				}

				// Fallthrough expected
			default:
				this.throwUnexpectedToken();
		}

		this.move();
	}

	/**
	 * Throws an exception stating the current token.
	 * @param message
	 */
	private throw(message: string): never {
		const {type, value, start, end} = this.current;
		throw new ParserException(
			`${message} ${TokenType[type]} ${value && JSON.stringify(value)}`,
			start,
			end,
		);
	}

	/**
	 * Throws an exception stating that the found token was not expected
	 */
	private throwUnexpectedToken(): never {
		this.throw('unexpected');
	}

	/**
	 * Throws an exception stating that an expected token was not found.
	 * @param expected The expected token.
	 */
	private throwExpectedNotFound(expected: string): never {
		this.throw(`expected "${expected}" instead of`);
	}
}

//
// Parsing levels:
// 0. Entry
// 1. Semicolon-separated statements
// 2. Assignments
// 3. Conditions
// 4. Logical operators
// 5. Comparison operators
// 6. Arithmetic operators (addition)
// 7. Arithmetic operators (multiplication)
// 8. Arithmetic operators (exponentiation)
// 9. Boolean negation
// 10. Keyword operators
// 11. Unary arithmetic operators
// 12. Array indexing
// 13. Parentheses
// 14. Function calls
// 15. Atoms (literals, variables)
//

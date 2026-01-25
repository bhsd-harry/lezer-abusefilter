import {ParserException} from './ParserException.js';
import {TokenType} from './TokenType.js';
import {relationKeywords, valueKeywords, conditionKeywords} from './Tokenizer.js';
import type {Token} from './Token';
import type {Dialect} from './analyzer';

const boolOps = ['&', '|', '^'],
	equalityOps = ['==', '===', '!=', '!==', '='],
	orderOps = ['<', '>', '<=', '>='],
	arithOps = ['+', '-', '*', '/', '%', '**'],
	unaryOps = ['+', '-'];

const isKeyword = (identifier: string): boolean =>
	relationKeywords.includes(identifier) || valueKeywords.has(identifier) || conditionKeywords.has(identifier);

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

	/** Non-syntax errors found during parsing. */
	private diagnostics: ParserException[];

	/** Local variables declared in the filter. */
	private locals = new Set<string>();

	/**
	 * @param dialect
	 */
	public constructor(private dialect: Dialect) {}

	/**
	 * Parses a list of AbuseFilter tokens into an expression tree.
	 *
	 * @param tokens The tokens to parse.
	 * @returns The parsed expression tree.
	 */
	public parse(tokens: readonly Token[]): void {
		this.tokens = tokens;
		this.mPos = -1; // -1 so that the first call to move() sets it to 0
		this.diagnostics = [];
		this.locals.clear();
		this.doLevelEntry();
		if (this.diagnostics.length > 0) {
			const error = this.diagnostics.pop()!;
			error.warnings = this.diagnostics;
			throw error;
		}
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
	private doLevelSemicolon(): Token | null {
		let statement: Token | null = null;
		do {
			// At the first iteration it can be garbage but the variable is used only
			// if there are at least two statements. It's guaranteed to be set correctly then.
			this.move();
			if (this.is(TokenType.EndOfStream) || this.is(TokenType.Parenthesis, ')')) {
				// Handle special cases which the other parser handled in doLevelAtom
				break;
			}

			// Allow empty statements.
			if (this.is(TokenType.StatementSeparator)) {
				continue;
			}
			statement = this.doLevelSet();
		} while (this.is(TokenType.StatementSeparator));
		return statement;
	}

	/** Handles variable assignment. */
	private doLevelSet(): Token | null {
		if (this.is(TokenType.Identifier)) {
			// Speculatively parse the assignment statement assuming it can
			// potentially be an assignment, but roll back if it isn't.
			// @todo Use this.getNextToken for clearer code
			const initialState = this.getState();
			const {current} = this;
			this.move();
			if (this.is(TokenType.Operator, ':=')) {
				this.throwInternal(current);
				this.locals.add(current.value);
				this.move();
				this.doLevelSet();
				return null;
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
					if (!this.throwInternal(current)) {
						this.throwUndefined(current);
					}
					this.move();
					this.doLevelSet();

					// TODO: index could be null, but the original parser acts this way
					return null;
				}
			}

			// If we reached this point, we did not find an assignment. Roll back
			// and assume this was just a literal.
			this.setState(initialState);
		}
		return this.doLevelConditions();
	}

	/** Handles ternary operator and if-then-else-end. */
	private doLevelConditions(): Token | null {
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
			return null;
		}
		const condition = this.doLevelBoolOps();
		if (this.is(TokenType.Operator, '?')) {
			this.move();
			this.doLevelConditions();
			if (!this.is(TokenType.Operator, ':')) {
				this.throwExpectedNotFound(':');
			}
			this.move();
			this.doLevelConditions();
			return null;
		}
		return condition;
	}

	/**
	 * Handles logic/arithmetic operators.
	 * @param ops The operators to handle.
	 * @param method The method to call for the next level.
	 */
	private doLevelBinaryOps(ops: string[], method: 'doLevelCompares' | 'doLevelBoolInvert'): Token | null {
		let leftOperand = this[method]();
		while (this.is(TokenType.Operator, ops)) {
			leftOperand = null;
			this.move();
			this[method]();
		}
		return leftOperand;
	}

	/** Handles logic operators. */
	private doLevelBoolOps(): Token | null {
		return this.doLevelBinaryOps(boolOps, 'doLevelCompares');
	}

	/** Handles comparison operators. */
	// eslint-disable-next-line @typescript-eslint/no-unused-private-class-members
	private doLevelCompares(): Token | null {
		let leftOperand = this.doLevelArithRels();

		// Only allow either a single operation, or a combination of a single equalityOps and a single
		// orderOps. This resembles what PHP does, and allows `a < b == c` while rejecting `a < b < c`
		let allowedOps = [...equalityOps, ...orderOps];
		while (this.is(TokenType.Operator, allowedOps)) {
			leftOperand = null;
			const disallowedOps = equalityOps.includes(this.current.value) ? equalityOps : orderOps;
			allowedOps = allowedOps.filter(op => !disallowedOps.includes(op));
			this.move();
			this.doLevelArithRels();
		}
		return leftOperand;
	}

	/** Handle arithmetic operators. */
	private doLevelArithRels(): Token | null {
		return this.doLevelBinaryOps(arithOps, 'doLevelBoolInvert');
	}

	/** Handles boolean inversion. */
	// eslint-disable-next-line @typescript-eslint/no-unused-private-class-members
	private doLevelBoolInvert(): Token | null {
		if (this.is(TokenType.Operator, '!')) {
			this.move();
			this.doLevelKeywordOperators();
			return null;
		}
		return this.doLevelKeywordOperators();
	}

	/** Handles keyword operators. */
	private doLevelKeywordOperators(): Token | null {
		const leftOperand = this.doLevelUnarys();
		if (this.is(TokenType.Keyword, relationKeywords)) {
			this.move();
			this.doLevelUnarys();
			return null;
		}
		return leftOperand;
	}

	/** Handles unary operators. */
	private doLevelUnarys(): Token | null {
		if (this.is(TokenType.Operator, unaryOps)) {
			this.move();
			this.doLevelArrayElements();
			return null;
		}
		return this.doLevelArrayElements();
	}

	/** Handles accessing an array element by an offset. */
	private doLevelArrayElements(): Token | null {
		let array = this.doLevelParenthesis();
		while (this.is(TokenType.SquareBracket, '[')) {
			array = null;
			this.doLevelSemicolon(); // TODO: index could be null, but the original parser acts this way
			if (!this.is(TokenType.SquareBracket, ']')) {
				this.throwExpectedNotFound(']');
			}
			this.move();
		}
		return array;
	}

	/** Handles parenthesis. */
	private doLevelParenthesis(): Token | null {
		if (this.is(TokenType.Parenthesis, '(')) {
			if (this.nextIs(TokenType.Parenthesis, ')')) {
				// Empty parentheses are never allowed
				this.move();
				this.throwUnexpectedToken();
			}
			// TODO: result could be null, but the original parser acts this way
			const result = this.doLevelSemicolon();
			if (!this.is(TokenType.Parenthesis, ')')) {
				this.throwExpectedNotFound(')');
			}
			this.move();
			return result;
		}
		return this.doLevelFunction();
	}

	/** Handles function calls. */
	private doLevelFunction(): Token | null {
		if (this.is(TokenType.Identifier) && this.nextIs(TokenType.Parenthesis, '(')) {
			if (this.dialect.functions?.includes(this.current.value) === false) {
				this.throw('unrecognized function', true);
			}
			const {value} = this.current;
			this.move();
			if (this.nextIs(TokenType.Parenthesis, ')')) {
				this.move();
			} else {
				let setFlag = value === 'set' || value === 'set_var';
				do {
					const thisArg = this.doLevelSemicolon();
					if (setFlag) {
						setFlag = false;
						if (thisArg?.type === TokenType.StringLiteral) {
							thisArg.type = TokenType.Identifier;
							thisArg.value = thisArg.value.toLowerCase();
							this.throwInternal(thisArg);
							this.locals.add(thisArg.value);
						}
					}
				} while (this.is(TokenType.Comma));
				if (!this.is(TokenType.Parenthesis, ')')) {
					this.throwExpectedNotFound(')');
				}
			}
			this.move();
			return null;
		}
		return this.doLevelAtom();
	}

	/** Handle literals. */
	private doLevelAtom(): Token | null {
		const {current} = this,
			{type, value} = current;
		switch (type) {
			case TokenType.Identifier:
				if (this.dialect.disabled?.includes(value)) {
					this.throw('use of disabled', true);
				} else if (this.dialect.deprecated?.includes(value)) {
					this.throw('use of deprecated', true, 'warning');
				} else if (this.dialect.functions?.includes(value) || isKeyword(value)) {
					this.throw('incorrect use of internal', true);
				} else if (this.dialect.variables?.includes(value) === false) {
					this.throwUndefined();
				}
				break;
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
		return type === TokenType.StringLiteral ? current : null;
	}

	/**
	 * Prepares a ParserException for the given token.
	 * @param token
	 * @param message
	 * @param quiet Whether to suppress the error.
	 * @param severity
	 */
	private getException(
		token: Token,
		message: string,
		severity?: 'error' | 'warning',
		quiet = true,
	): ParserException {
		const {type, value, start, end} = token;
		return new ParserException(
			`${message} ${TokenType[type]} ${value && JSON.stringify(value)}`,
			start,
			end,
			quiet ? undefined : this.diagnostics,
			severity,
		);
	}

	/**
	 * Throws an exception stating the current token.
	 * @param message
	 * @param quiet Whether to suppress the error.
	 * @param severity
	 */
	private throw(message: string, quiet?: false): never;
	private throw(message: string, quiet: true, severity?: 'error' | 'warning'): void;
	private throw(message: string, quiet = false, severity?: 'error' | 'warning'): void {
		const error = this.getException(this.current, message, severity, quiet);
		if (!quiet) {
			throw error;
		}
		this.diagnostics.push(error);
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

	/**
	 * Throws an exception stating that an internal identifier is being redeclared.
	 * @param token The token being assigned to.
	 */
	private throwInternal(token: Token): boolean {
		const {functions, variables, deprecated, disabled} = this.dialect,
			{value} = token;
		if (
			functions?.includes(value)
			|| variables?.includes(value)
			|| deprecated?.includes(value)
			|| disabled?.includes(value)
			|| isKeyword(value)
		) {
			this.diagnostics.push(this.getException(token, 'assign to internal'));
			return true;
		}
		return false;
	}

	/**
	 * Throws an exception stating that an undefined local variable is being used.
	 * @param token The token being assigned to.
	 */
	private throwUndefined(token = this.current): boolean {
		const {value} = token;
		if (!this.locals.has(value)) {
			this.diagnostics.push(this.getException(token, 'undefined local', 'warning'));
			return true;
		}
		return false;
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

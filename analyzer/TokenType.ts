/**
 * represents distinct types of tokens that can appear in the filter text.
 * Token types are categories used subsequently by the parser to properly
 * create the output syntax tree.
 */
export enum TokenType {

	/** A special type of token designating an end of the input stream. */
	EndOfStream,

	/** A variable or function name. */
	Identifier,

	/** A reserved word like `in` or `rlike`. */
	Keyword,

	/** String literal enclosed in quotes or apostrophes. */
	StringLiteral,

	/** Whole number literal; decimal, hexadecimal, octal or binary. */
	IntLiteral,

	/** Literal for a number with fractional part. */
	FloatLiteral,

	/** One of the operators like `+` or `>=`. */
	Operator,

	/** Left or right parenthesis: `(` or `)`. */
	Parenthesis,

	/** Left or right bracket: `[` or `]`. */
	SquareBracket,

	/** A comma `,`. */
	Comma,

	/** A semicolon `;`. */
	StatementSeparator,
}

import type {ParserException as ParserExceptionInterface} from './analyzer.d.ts';

/**
 * A simple class modelling a parser exception.
 */
export class ParserException extends Error implements ParserExceptionInterface {
	/**
	 *
	 */
	public constructor(message: string, public from: number, public to?: number) {
		super(message);
	}
}

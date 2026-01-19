import type {ParserException as ParserExceptionInterface} from './analyzer';

/**
 * A simple class modelling a parser exception.
 */
export class ParserException extends Error implements ParserExceptionInterface {
	/**
	 *
	 */
	public constructor(
		message: string,
		public from: number,
		public to?: number,
		public warnings?: ParserException[],
		public severity?: 'error' | 'warning',
	) {
		super(message);
	}
}

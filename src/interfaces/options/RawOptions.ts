import type RequestOptions from './RequestOptions';

/**
 * Options for a raw request.
 */
interface RawOptions extends Omit<RequestOptions, 'keyMapper'> {}

export default RawOptions;

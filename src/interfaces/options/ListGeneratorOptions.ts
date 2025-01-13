import type ListOptions from './ListOptions';

/**
 * Options for a list generator request
 */
interface ListGeneratorOptions extends Omit<ListOptions, 'useCache'> {}

export default ListGeneratorOptions;

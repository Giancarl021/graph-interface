/**
 * Type that makes all K properties of T partial, and keep the rest of the properties as they are.
 */
type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export default WithOptional;

import type Nullable from './util/Nullable';

type MassiveResult<T> = Record<string, Nullable<T>>;

export default MassiveResult;

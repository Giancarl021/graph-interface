import Nullable from './util/Nullable';

interface MassiveResult<T> {
    [binder: string]: Nullable<T>;
}

export default MassiveResult;
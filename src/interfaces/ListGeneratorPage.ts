import type Nullable from './util/Nullable';

interface ListGeneratorPage<T> {
    items: T[];
    pageTokens: {
        current: Nullable<string>;
        next: Nullable<string>;
    };
}

export default ListGeneratorPage;

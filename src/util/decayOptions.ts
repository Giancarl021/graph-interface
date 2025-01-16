import type {
    ListGeneratorOptions,
    ListOptions,
    RawOptions,
    UnitOptions
} from '../interfaces';

export function toUnitOptions(
    options: ListOptions | ListGeneratorOptions
): UnitOptions {
    return {
        body: options.body,
        headers: options.headers,
        keyMapper: null,
        method: options.method,
        useCache: false
    };
}

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
        keyMapper: options.keyMapper,
        method: options.method,
        useCache: false
    };
}

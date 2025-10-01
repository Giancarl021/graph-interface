export type ApiClientInstance = ReturnType<typeof ApiClient>;

export default function ApiClient() {
    async function raw() {}

    async function single<T = unknown>(): Promise<T> {
        return {} as T;
    }

    async function paginate<T = unknown>(): Promise<T[]> {
        return [];
    }

    async function* createPageGenerator<T = unknown>(): AsyncIterable<T[]> {
        yield [];
    }

    async function batch() {}

    return {
        raw,
        single,
        paginate,
        createPageGenerator,
        batch
    };
}

# list generator

This method allows you to paginate between a list of entities, like in [users](https://docs.microsoft.com/en-us/graph/api/user-list) using [Async Iterators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator).

## Usage

JavaScript:

```javascript
const items = [];

for await (const page of graph.createListGenerator(resource, options)) {
    items.push(page.items);
}
```

TypeScript:

```typescript
const items: T[] = [];

for await (const page of graph.createListGenerator<T>(resource, options)) {
    items.push(page.items);
}
```

## Parameters

### `resource`

The string representing the resource on the Graph API to retrieve, like `users`.

This parameter is required, and will concatenate with the full endpoint in the Graph API, allowing you to write query parameters like `$select` and `$filter`.

### (Optional) `options`

Dictates the behavior of the list request, such as headers, body, method and the limit and offset of the pagination.

This parameter interface extends the [`ListOptions`](list.md) interface, removing only the cache capability.

> **Note:** The options properties are all optional, as the following interface will be wrapped in a `Partial<T>` type.

```typescript
interface ListGeneratorOptions extends Omit<ListOptions, 'useCache'> {}
```

- **limit** - The maximum number of requests processed. Default is `undefined`;

- **offset** - The number of requests to skip from the beginning. Default is `undefined`;

- **waitingTimeBetweenPages** - The time in milliseconds between each page request. Useful when this method gives the `429 - Too Many Requests` error status code.

### (TypeScript) `T`

The type a single resource returned by the Graph API.

## How `limit` and `offset` works

Both of this properties work with the quantity of **requests** made, **NOT** the quantity of entities returned.

You can control the quantity of total entities by using the `$top` query parameter or by combining it with this properties if the desired quantity is too large.

### `limit`

This property limits the quantity of requests made to the Graph API. So, if you have a list of 1000 users, but only want the first 100, you can set the `limit` to `1`, as by default the Graph API returns 100 entities per page.

> **Note:** This property means the upper bound limit, which means that if the quantity of entities is smaller than the limit, all the entities will be returned.

### `offset`

This property skips the first `n` requests, allowing you to skip the first entities on the list. So, if you have a list of 1000 users, but you only want the users starting from the 100th position, you can set the `offset` property to `1`, as by default the Graph API returns 100 entities per page.

> **Note:** This property skips the first entities entirely, which means that if the quantity of entities is smaller than the offset, no entities will be returned.

### Using both

When you set both `limit` and `offset`, the number of requests will be `limit + offset`, starting counting from the `offset` position, until it reaches the `limit` or end of the list.

> **Note:** The `limit` property does not means the quantity of requests, but the quantity of requests processed, so, if used combined with `offset`, the total number of requests will be larger.

## Returns

A `Promise` that resolves into a Array of `ListGeneratorPage` with entities of each page defined by the `T` type. The `ListGeneratorPage` interface is defined as follows:

```typescript
interface ListGeneratorPage<T> {
    items: T[];
    pageTokens: {
        current: Nullable<string>;
        next: Nullable<string>;
    };
}

type Nullable<T> = T | null;
```

Each page will have its entities stored in the `items` property, and the `pageTokens` property will have the `current` and `next` tokens, allowing you to paginate between the pages, with recovery if the request fails.

To allow property renaming inside the items, you can use the [`keyMapper`](keyMapper.md) property in the `options` parameter.

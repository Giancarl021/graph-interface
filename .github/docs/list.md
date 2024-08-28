# list

This method allows you to paginate between a list of entities, like in [users](https://docs.microsoft.com/en-us/graph/api/user-list).

## Usage

JavaScript:

```javascript
const data = await graph.list(resource, options);
```

TypeScript:

```typescript
const data = await graph.list<T>(resource, options);
```

## Parameters

### `resource`

The string representing the resource on the Graph API to retrieve, like `users`.

This parameter is required, and will concatenate with the full endpoint in the Graph API, allowing you to write query parameters like `$select` and `$filter`.

### (Optional) `options`

Dictates the behavior of the list request, such as headers, body, method, if the response should be cached and the limite and offset of the pagination.

This parameter interface extends the [`RequestOptions`](requestOptions.md) interface.

> **Note:** The options properties are all optional, as the following interface will be wrapped in a `Partial<T>` type.

```typescript
interface ListOptions extends RequestOptions {
    limit?: number;
    offset?: number;
}
```

-   **limit** - The maximum number of requests processed. Default is `undefined`;

-   **offset** - The number of requests to skip from the beginning. Default is `undefined`.

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

A `Promise` that resolves into a Array of entities of all pages defined to retrieve data.

Some properties will be lost in the process of pagination, such as `@odata.context` and `@odata.nextLink`.

This method will aggregate all pages into a single array.

To allow property renaming, you can use the [`keyMapper`](keyMapper.md) property in the `options` parameter.

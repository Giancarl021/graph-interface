# unit

This method allows you to make requests that return a single entity, like in [`users/<id | userPrincipalName>`](https://docs.microsoft.com/en-us/graph/api/user-get).

## Usage

JavaScript:

```javascript
const data = await graph.unit(resource, options);
```

TypeScript:

```typescript
const data = await graph.unit<T>(resource, options);
```

## Parameters

### `resource`

The string representing the resource on the Graph API to retrieve, like `users/<id | userPrincipalName>`.

This parameter is required, and will concatenate with the full endpoint in the Graph API, allowing you to write query parameters like `$select` and `$filter`.

### (Optional) `options`

Dictates the behavior of the unit request, such as headers, body, method and if the response should be cached.

This parameter interface extends the [`RequestOptions`](requestOptions.md) interface.

```typescript
interface UnitOptions extends RequestOptions { }
```

### (TypeScript) `T`

The type of the resource returned by the Graph API. To allow property renaming, you can use the [`keyMapper`](keyMapper.md) property in the `options` parameter.

## Returns

A `Promise` that resolves into the response body of the request.
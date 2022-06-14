# getAccessToken

> This method is already used internally, but if you need the access token for a custom request, you can get it from here.

This method allows to get the access token to use the Graph API requests on the `Authorization` header.

## Usage

```javascript
const token = await graph.getAccessToken(options);
```

## Parameters

### (Optional) `options`
Dictates the behavior of the method, allowing to decide if the response should be cached or not.

Have the following interface:

> **Note:** The options properties are all optional, as the following interface will be wrapped in a `Partial<T>` type.

```typescript
interface TokenOptions {
    useCache: boolean;
}
```

* **useCache** - If `true`, the access token will be cached using the `CacheService` object initialized with the client. Default `true`.

## Returns

A `Promise` that resolves into the access token string. In order to use it, you need to add it to the `Authorization` header of the request, prefixed with `Bearer `. If the `AuthenticationProvider` is set in the `GraphOptions` of the client, the set method will be called to get the access token.
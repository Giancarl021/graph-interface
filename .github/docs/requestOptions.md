# requestOptions

This interface is used as a base for all the options used in the [unit](unit.md), [list](list.md) and [massive](massive.md) methods. It provides all the basic properties to configure an Graph API request.

## Properties

This interface is defined as the following:

```typescript
interface RequestOptions {
    useCache: boolean;
    method: string;
    headers: HttpHeaders
    body: any;
    keyMapper: Nullable<KeyMapper>;
}

interface HttpHeaders {
    [header: string]: string;
}

interface KeyMapper {
    [originalName: string]: KeyMapperItem | string;
}

interface KeyMapperItem {
    name: string;
    value: KeyMapper;
}

type Nullable<T> = T | null;
```

* **useCache** - If `true`, the client will use the `CacheService` to cache the response. Default `false`;

* **method** - The HTTP method to use for the request. Default `GET`;

* **headers** - Custom headers to be added on the request. Default `{}`. _Importante: The Access Token will be automatically put in the headers, so it is not necessary to put it manually_;

* **body** - The body of the request. Default `null`;

* **keyMapper** - A [`keyMapper`](keyMapper.md) object to allows property renaming on the response body. Default `null`.
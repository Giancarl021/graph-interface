# massive

This method allow you to make a lot of similar requests, which does not have a properly paginated endpoint. For example:

-   You need to get the [`licenseDetails`](https://docs.microsoft.com/en-us/graph/api/user-list-licensedetails) from every user in a tenant;

-   As you need to make one request for each user, you cannot simply use the [`list`](list.md) method (considering that, when this documentation was written, you could not use `$select` or `$expand` to get the `licenseDetails` from a normal paginated request);

-   The best approach would be to use the `$batch` endpoint on Graph API, but it would need a lot of work to package the needed requests in packages of 20;

-   The [`massive`](massive.md) method handle all the above problems, requiring only a string pattern of the resource and the values to interpolate.

## Usage

JavaScript:

```javascript
const data = await graph.massive(pattern, options);
```

TypeScript:

```typescript
const data = await graph.massive<T>(pattern, options);
```

## Parameters

### `pattern`

The string pattern of the resource to be interpolated, like `users/{0}/licenseDetails`.

This parameter is required, and will concatenate with the full endpoint in the Graph API, allowing you to write query parameters like `$select` and `$filter`.

The pattern will be interpolated using a number indexing system, matching all `{NUMBER}` occurrences.

### `options`

Dictates the behavior of the massive request, such as headers, body, method, if the response should be cached and general behavior of the batch request cycle, such as attempts.

This parameter interface extends the [`RequestOptions`](requestOptions.md) interface and is wrapped in a custom `Partial<T>` type to require some options.

```typescript
interface MassiveOptions extends Omit<RequestOptions, 'headers'> {
    headers: Nullable<HttpHeaders>;
    batchRequestHeaders: HttpHeaders;
    values: Nullable<string[] | string[][]>;
    binderIndex: number;
    attempts: number;
    requestsPerAttempt: number;
    nullifyErrors: boolean;
}

interface HttpHeaders {
    [header: string]: string;
}

type Nullable<T> = T | null;

type PartialMassiveOptions = WithOptional<MassiveOptions, OptionalKeys>;

type OptionalKeys = keyof RequestOptions | keyof Omit<MassiveOptions, 'values'>;

type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
```

-   **headers** - Custom headers to be added on each single request. Default `null`;

-   **batchRequestHeaders** - Custom headers to be added on the `$batch` requests. Default `{}`;

-   **values** - The values to be interpolated on the pattern. Default `null`;

-   **binderIndex** - The index of the list set in the `values` property in which the string values should be used as the keys in the result object. Default `0`;

-   **attempts** - The maximum number of attempts to make before stopping the process. Default `3`;

-   **requestsPerAttempt** - The maximum number of `$batch` requests to make per attempt. Default `50`;

-   **nullifyErrors** - If `true`, when the attempts reach the limit set in the `attempts` property, the errors will be nullified and the response will be returned. If `false`, the method will throw an Error. Default `false`;

### (TypeScript) `T`

The type a single resource returned by the Graph API.

## Data interpolation

On the property `values` in the `options` parameter, you can pass a list of lists od strings, where each list represents an index on the `pattern` parameter. All the lists should have the same length.

For example:

```javascript
const data = await graph.massive('users/{1}/licenseDetails?$select={0}', {
    values: [
        ['id', 'skuId', 'skuPartNumber'],
        ['id-1', 'id-2', 'id-3']
    ]
});
```

In the example above, the requests would be interpolated as:

-   `users/id-1/licenseDetails?$select=id`

-   `users/id-2/licenseDetails?$select=skuId`

-   `users/id-3/licenseDetails?$select=skuPartNumber`

Usually you will probably want to interpolate a single value, so, to make things easier, you can pass a single list of strings.

## Request Cycle

While stability is an important factor, this method is not designed to not fail, as the other methods of this package. Actually, it relies that errors will be thrown, and it deal with them as a normal part of the cycle.

When you need to make a lot of requests, even when shrinking the number of requests, using the `$batch` endpoint, some of them will eventually fail, mostly because of the rate limit of the Graph API, which returns, in this cases, the status code `427 - Too Many Requests`. To deal with this problem, the request cycle works as follows:

-   All the requests are packaged into batches of 20;

-   All the batches are sent to the `$batch` endpoint, in blocks of `requestsPerAttempt` requests, using throttling to limit the amount of requests sent at the same time;

-   The responses are parsed and unpacked into single results;

-   If a response is not successful, it will be pushed back into the cycle, while a successful one will be added to the result object;

-   The cycle repeats until it has not more requests to be sent or the maximum number of attempts is reached.

To avoid an infinite loop, the `attempts` property in `options` parameter can be used to set the maximum number of attempts. When the limit is reached. the cycle will stop and, depending on the `nullifyErrors` property, the errors be ignored and set as `null` or the cycle will throw an exception.

> **Note:** The number of attempts only increases when all the requests sent are unsuccessful.

## Headers

This method in specific have a different behavior on the `headers` property of the `options` parameter. You may noticed that two properties regarding headers exist, the `headers` and `batchRequestHeaders`.

The `headers` property will be used to set the headers of each `single` request, while the `batchRequestHeaders` property will be used to set the headers of the `$batch` requests.

It is important to notice the difference, because each one of them are used for different purposes.

## Returns

A `Promise` that resolves into a Object of entities, which key based on the `values` on the `binderIndex` value, with an entity for each key.

It is important to note that, as the results will not be further parsed, paginated requests inside a `$batch` request will not be further parsed.

To allow property renaming, you can use the [`keyMapper`](keyMapper.md) property in the `options` parameter.

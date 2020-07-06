# graph-interface
A module to simplify the [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/overview) requests on tenants.



## Installation

Run
```bash
npm install graph-interface --save
```
or, if you use Yarn
```bash
yarn add graph-interface
```

## Configuration

Import the module:
```javascript
const createGraphInterface = require('graph-interface');
```
To instantiate the client you must have the tenant credentials to call the Graph API:
```javascript
const credentials = {
	tenantId: '...',
	clientId: '...',
	clientSecrets: '...'
};
```
You can pass some options too:
```javascript
const options = {
    version: 'v1.0', // v1.0 or beta
    supressWarnings: false, // Will not print the warnings when requesting unit or list
    cache: {
        type: null, // null | 'fs' | 'redis'
        tokenCache: true, // Use token cache or not
        fs: {
            cleanupInterval: 3600, // Interval to Garbage Collection of caches
            path: '.gphcache', // The folder where the cache data will be stored
        },
        redis: { // Same values you will use in a redis.createClient
            host: '127.0.0.1',
            port: 6379,
            family: 'IPv4',
            db: null,
            password: null,
            url: null,
            path: null
        }
    }
};
```
The creation of client is asynchronous:
```javascript
const graph = await createGraphInterface(credentials, options);
```

## Usage

The client have 5 methods, all asynchronous:

#### getToken

Parameters:

```javascript
const options = {
    saveOn: null // Path to filename with the result of the request
};
```
Call:
```javascript
const token = await graph.getToken(options);
```
The return will be the [Bearer Token](https://docs.microsoft.com/en-us/graph/auth/) to use all the methods in the client.
* You do not need to call this method to use the others, you must use just when you need the token.

#### unit
Parameters:

```javascript
const url = 'users/{user-id}';
const options = {
    saveOn: null, // Path to filename with the result of the request
    method: 'GET', // The method of the request
    cache: {
        expiresIn: null // The Time To Live (TTL) in seconds of the response if you configured an cache on the global options
    },
    fields: [] // An array with the fields of the response you want to return (can be combined with the $select oData attribute)
};
```
Call:
```javascript
const unit = await graph.unit(url, options);
```

#### list

Parameters:
```javascript
const url = 'users';
const options = {
    saveOn: null, // Path to filename with the result of the request
    method: 'GET', // The method of the request
    cache: {
        expiresIn: null // The Time To Live (TTL) in seconds of the response if you configured an cache on the global options
    },
    map: null, // Predicate to execute an map on the response
    filter: null, // Predicate to execute an filter on the response
    reduce: null, // Predicate to execute an reduce on the response
    limit: null, // The number of maximum of pages to request
    offset: null // The index of the first page to get response (the module will request the previous pages until get the index of the offset)
};
```
Call:
```javascript
const list = await graph.list(url, options);
```

#### massive
Parameters:
```javascript
const urlPattern = 'users/{id}/licenseDetails';
const values = {
	id: ['...', '...', '...'] // Each key in this object will be replaced in the urlPattern. All keys should have the same length
}
const options = {
    saveOn: null, // Path to filename with the result of the request
    method: 'GET', // The method of the request
    cache: {
        expiresIn: null // The Time To Live (TTL) in seconds of the response if you configured an cache on the global options
    },
    binder: null, // [REQUIRED] The key in the values object that will be the key in the response object
    cycle: {
    	async: true, // Defines if the requests will be made in parallelism or linearly
    	attemps: 3, // The maximum of attempts to the same quantity of errors
    	requests: 50 // The number of requests made in the same cycle on asynchronous mode
	},
    type: null // [REQUIRED] 'unit' | 'list'
};
```
Call:
```javascript
const massive = await graph.massive(urlPattern, values, options);
```

#### close

Close all connections with external resources.

Call:

```javascript
await graph.close();
```
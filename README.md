# httplog

Extension to log HTTP requests to Harper components

## Notes

- Consider this a PoC
- This is not 100% functional.  It is not properly catching errors (eg. 404s) as I believe the null response is turned into that after the `server.http` callbacks are made


## Example config.yaml

```
httplog:
  package: 'httplog'
  fileName: 'http.log'
  maxSize: 1mb
  maxFiles: 7
  rotationFrequency: 1h
  logWriteInterval: 1s
rest: true
graphql: true
graphqlSchema:
  files: schema.graphql
jsResource:
  files: resources.js
```

## Example package.json for local inclusion

```
{
  "type": "module",
  "dependencies": {
    "httplog": "file:../../extensions/httplog"
  }
}
```

## Things I would like to log
- start time (when the accept occurred)
- tls time
- time the request was fully read
- time betwwen request end and first byte written to client
- request header size
- request body size 
- response header size
- response object size
- total bytes send (different for h2 / h3 )
- host header
- client ip
- url requested
- method
- response status code
- content-type request
- content-type response
- *user-agent
- *cookie
- tls version
- tls cipher
- request id
- *custom field(s)
- thread id
- connection id


## we should also log forward requests for data fetches 

We might have to provide a library that enables the logging.  If they use something different they do not get the standard logging mechanism.

- start time
- tls time
- dns time
- req end time
- time to first byte from server
- time to last byte
- bytes  received
- header size
- origin ip
- client request id
- method
- url
- http response code
- content-type
- tls info
- request id
- error codes
  

# httplog

Extension to log HTTP requests to Harper components

## Notes

- Consider this a PoC
- This is not 100% functional. 

### Todo

- Make the logging configurable
- Add custom field(s) that components can set
- Add authentication to the taillog endpoint
- Simplify the implementation, serious refatoring needed
- Potentially integrate as a core component
- Handle core generated errors better



## Example config.yaml

```
httplog:
  package: 'httplog'
  fileName: 'http.log'
  maxSize: 1mb
  maxFiles: 7
  rotationFrequency: 1h
  logWriteInterval: 1s
  tail: false
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
- +host header
- +client ip
- +url requested
- +method
- +response status code
- content-type request
- content-type response
- *user-agent
- *cookie
- tls version
- tls cipher
- +request id
- +custom field(s)
- thread id (part of the request ID)
- connection id (releant for PConns )

* - this should be configurable and not on my default
+ - Already in the extension
  
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
  

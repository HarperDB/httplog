# httplog

Extension to log HTTP requests to Harper components

## Notes

- Consider the a PoC
- This is not 100% functional.  It is not properly catching errors (eg. 404s) as I beleive the null repsonse is turned into that after the `server.http` callbacks are made
- Log rotation is not implemented
- Log size limiting is not implemented


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


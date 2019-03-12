# About

A HTTP 206 Partial Content handler to serve any readable stream partially in Express.

Based on this blog post: https://www.codeproject.com/Articles/813480/HTTP-Partial-Content-In-Node-js.

# Installation

`yarn add express-partial-content`

OR

`npm install express-partial-content`

> Note: `Express` package is a peer dependency for `express-partial-content` and must be present in dependencies of the host package.

# Usage

From the `express-file-server` example:

1.  Implement a `ContentProvider` function which prepares and returns a `Content` object:

        import fs from "fs";
        import { Range, ContentDoesNotExistError, ContentProvider } from "express-partial-content";
        import {logger} from "./logger";

        const statAsync = promisify(fs.stat);
        const existsAsync = promisify(fs.exists);

        export const fileContentProvider: ContentProvider = async (req: Request) => {
          // Read file name from route params.
          const fileName = req.params.name;
          const file = `${__dirname}/files/${fileName}`;
          if (!(await existsAsync(file))) {
            throw new ContentDoesNotExistError(`File doesn't exist: ${file}`);
          }
          const stats = await statAsync(file);
          const totalSize = stats.size;
          const mimeType = "application/octet-stream";
          const getStream = (range?: Range) => {
            if (!range) {
              // Request if for complete content.
              return fs.createReadStream(file);
            }
            // Partial content request.
            const { start, end } = range;
            logger.debug(`start: ${start}, end: ${end}`);
            return fs.createReadStream(file, { start, end });
          };
          return {
            fileName,
            totalSize,
            mimeType,
            getStream
          };
        };

2.  In your express code, use `createPartialStreamHandler` factory method to generate an express handler for serving partial content for the route of your choice:

        import {createPartialStreamHandler} from "express-partial-content";
        import {logger} from "./logger";

        const handler = createPartialStreamHandler(fileContentProvider, logger);

        const app = express();
        const port = 8080;

        // File name is a route param.
        app.get("/files/:name", handler);

        app.listen(port, () => {
          logger.debug("Server started!");
        });

3.  Run your server and use a multi-part/multi-connection download utility like [aria2c](https://aria2.github.io/) to test it:

        aria -x5 -k1M http://localhost:8080/files/file1.txt

# Reference

## createPartialStreamHandler function:

The package exports `createPartialStreamHandler` factory method.

### Arguments:

- `contentProvider`: An `async` function which returns a Promise resolved to a `Content` object (see below).
- `logger`: Any logging implementation which has a `debug(message:string, extra: any)` method. Either `winston` or `bunyan` loggers should work.

### Returns:

- Express Route Handler: `createPartialStreamHandler` returns an express handler which can be mapped to an Express route to serve partial content.

## ContentProvider function:

This function _needs to be implemented by you_. It's purpose is to fetch and return `Content` object containing necessary metadata and methods to stream the content partially. This method is invoked by the express handler (returned by `createPartialStreamHandler`) on each request.

### Arguments:

- `Request`: It receives the `Request` object as it's only input. Use the information available in `Request` to find the requested content, e.g. through `Request.params` or query string, headers etc.

### Returns:

- `Promise<Content>`: See below.

### Throws:

- `ContentDoesNotExistError`: Throw this to indicate that the content doesn't exist. The generated express handler will return a 404 in this case.
  > Note: Any message provided to the `ContentDoesNotExistError` object is returned to the client.

## Content object:

This object contains metadata and methods which describe the content. The `ContentProvider` method builds and returns it.

### Properties:

All the properties of this object are used to return content metadata to the client as various `Response` headers.

- `fileName`: Used as the `Content-Disposition` header's `filename` value.
- `mimeType`: Used as the `Content-Type` header value.
- `totalSize`: Used as the `Content-Length` header value.

### Methods:

- `getStream(range?: Range)`: This method should return a readable stream initialized to the provided `range` (optional). You need to handle two cases:

  - range is `null`: When `range` is not-specified, the client is requesting the full content. In this case, return the stream as it is.
  - range is `{start, end}`: When client requests partial content, the `start` and `end` values will point to the corresponding byte positions (0 based and inclusive) of the content. You need to return stream limited to these positions.

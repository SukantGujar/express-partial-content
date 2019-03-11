import express, { Request } from "express";
import { promisify } from "util";
import fs from "fs";
import { Range, createPartialStreamHandler, ContentDoesNotExistError, ContentProvider } from "../../index";

const statAsync = promisify(fs.stat);
const existsAsync = promisify(fs.exists);

const fileContentProvider: ContentProvider = async (req: Request) => {
  const fileName = req.params.name;
  const file = `${__dirname}/files/${fileName}`;
  if (!(await existsAsync(file))) {
    throw new ContentDoesNotExistError(`File doesn't exists: ${file}`);
  }

  const stats = await statAsync(file);
  const totalSize = stats.size;
  const mimeType = "application/octet-stream";
  const getStream = (range?: Range) => {
    if (!range) {
      return fs.createReadStream(file);
    }
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

const logger = {
  debug(message: string, extra?: any) {
    if (extra) {
      console.log(`[debug]: ${message}`, extra);
    } else {
      console.log(`[debug]: ${message}`);
    }
  }
};

const handler = createPartialStreamHandler(fileContentProvider, logger);

const app = express();
const port = 8080;

app.get("/files/:name", handler);

app.listen(port, () => {
  logger.debug("Server started!");
});

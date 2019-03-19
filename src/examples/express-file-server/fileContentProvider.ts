import { Request } from "express";
import fs from "fs";

import { Range, ContentDoesNotExistError, ContentProvider } from "../../index";
import { existsAsync, statAsync } from "./utils";
import { logger } from "./logger";

export const fileContentProvider: ContentProvider = async (req: Request) => {
  const fileName = req.params.name;
  const file = `${__dirname}/../sample-files/${fileName}`;
  if (!(await existsAsync(file))) {
    throw new ContentDoesNotExistError(`File doesn't exist: ${file}`);
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

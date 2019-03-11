import express from "express";
import { promisify } from "util";
import fs from "fs";
import { createPartialStreamHandler } from "../../index";
import { fileContentProvider } from "./fileContentProvider";

export const statAsync = promisify(fs.stat);
export const existsAsync = promisify(fs.exists);

export const logger = {
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

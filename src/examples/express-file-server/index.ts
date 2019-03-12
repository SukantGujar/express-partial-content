import express from "express";
import { createPartialContentHandler } from "../../index";
import { fileContentProvider } from "./fileContentProvider";
import { logger } from "./logger";

const handler = createPartialContentHandler(fileContentProvider, logger);

const app = express();
const port = 8080;

app.get("/files/:name", handler);

app.listen(port, () => {
  logger.debug("Server started!");
});

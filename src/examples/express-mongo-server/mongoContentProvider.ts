import { Request } from "express";
import fs from "fs";
import path from "path";
import { MongoClient, Db, GridFSBucket } from "mongodb";
import { Range, ContentDoesNotExistError, ContentProvider } from "../../index";
import { getFileMeta } from "./utils";
import { logger } from "./logger";
import { MongoFileDocument } from "./MongoFileDocument";

const connectionString = process.env["MongoUrl"];

if (!connectionString) {
  throw new Error("MongoUrl env var is not defined!");
}

const client = new MongoClient(connectionString, { useNewUrlParser: true });
let db: Db;
let bucket: GridFSBucket;
client.connect(error => {
  if (error) {
    throw error;
  }

  db = client.db("test");

  bucket = new GridFSBucket(db);
  bucket.drop(error => {
    if (error && error.message !== "ns not found") {
      throw error;
    }

    console.info("Dropped bucket.");

    const fileName = "readme.txt";

    const readStream = fs.createReadStream(path.join(__dirname, "files", fileName));

    readStream.on("close", () => {
      console.log("readme.txt uploaded to gridfs.");
    });

    const writeStream = bucket.openUploadStream(fileName, { contentType: "text/plain" });

    readStream.pipe(writeStream);
  });
});

export const mongoContentProvider: ContentProvider = async (req: Request) => {
  const fileName = req.params.name;
  const file = await getFileMeta(fileName, db);
  if (!file) {
    throw new ContentDoesNotExistError(`File doesn't exist: ${fileName}`);
  }
  const totalSize = file.size;
  const mimeType = file.contentType;
  const getStream = (range?: Range) => {
    if (!range) {
      return bucket.openDownloadStreamByName(fileName);
    }
    const { start, end } = range;
    logger.debug(`start: ${start}, end: ${end}`);
    // Note: The `end` offset in Mongo stream isn't inclusive, need to append 1 to it to ensure it returns
    // the right sized content. Otherwise the stream size will be one byte short of the expected value.
    return bucket.openDownloadStreamByName(fileName, { start, end: end + 1, revision: -1 });
  };
  return {
    fileName,
    totalSize,
    mimeType,
    getStream
  };
};

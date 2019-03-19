import { Db } from "mongodb";
import { MongoFileDocument } from "./MongoFileDocument";
import { logger } from "./logger";

export const getFileMeta = async (fileName: string, db: Db) => {
  logger.debug(`Fetching file information for ${fileName}`);
  const result = await db.collection("fs.files").findOne({ filename: fileName });
  logger.debug(`File meta: `, result);
  return result
    ? {
        _id: result._id,
        contentType: result.contentType,
        fileName,
        size: result.length
      }
    : null;
};

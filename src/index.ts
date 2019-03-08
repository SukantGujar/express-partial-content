import { Request, Response } from "express";
import { parseRangeHeader, RangeParserError, Range } from "./parseRangeHeader";
import { Stream } from "stream";

/**
 * @type {function (Request): Promise<Content>}
 */
export type ContentProvider = (req: Request) => Promise<Content>;

export class ContentDoesNotExistError extends Error {}

export interface Logger {
  debug(message: string, extra?: any): void;
}

export type Content = {
  /**
   * Returns a readable stream based on the provided range (optional).
   * @param {Range} range The start-end range of stream data.
   * @returns {Stream} A readable stream
   */
  getStream(range?: Range): Stream;
  /**
   * Total size of the content
   */
  readonly totalSize: number;
  /**
   * Mime type to be sent in Content-Type header
   */
  readonly mimeType: string;
  /**
   * File name to be sent in Content-Disposition header
   */
  readonly fileName: string;
};

const getHeader = (name: string, req: Request) => req.headers[name];
const getRangeHeader = getHeader.bind(null, "range");
const setHeader = (name: string, value: string, res: Response) => res.setHeader(name, value);
const setContentTypeHeader = setHeader.bind(null, "Content-Type");
const setContentLengthHeader = setHeader.bind(null, "Content-Length");
const setAcceptRangesHeader = setHeader.bind(null, "Accept-Ranges", "bytes");
const setContentRangeHeader = (range: Range | null, size: number, res: Response) =>
  setHeader("Content-Range", `bytes ${range ? `${range.start}-${range.end}` : "*"}/${size}`, res);
const setContentDispositionHeader = (fileName: string, res: Response) =>
  setHeader("Content-Disposition", `attachment; filename="${fileName}"`, res);
const setCacheControlHeaderNoCache = setHeader.bind(null, "Cache-Control", "no-cache");

export function create(contentProvider: ContentProvider, logger: Logger) {
  return async function handler(req: Request, res: Response) {
    let content;
    try {
      content = await contentProvider(req);
    } catch (error) {
      logger.debug("ContentProvider threw exception: ", error);
      if (error instanceof ContentDoesNotExistError) {
        return res.status(400).send(error.message);
      }

      return res.sendStatus(500);
    }

    let { getStream, mimeType, fileName, totalSize } = content;

    const rangeHeader = getRangeHeader(req);
    let range;
    try {
      range = parseRangeHeader(rangeHeader, totalSize);
    } catch (error) {
      logger.debug(`parseRangeHeader error: `, error);
      if (error instanceof RangeParserError) {
        setContentRangeHeader(null, totalSize, res);

        return res
          .send(error.message)
          .status(416)
          .end();
      }

      return res.sendStatus(500);
    }

    let { start, end } = range;

    setContentTypeHeader(mimeType, res);
    setContentDispositionHeader(fileName, res);
    setAcceptRangesHeader(res);

    // If range is not specified, or the file is empty, return the full stream
    if (range === null) {
      setContentLengthHeader(totalSize, res);
      return getStream().pipe(res);
    }

    setContentRangeHeader(range, totalSize, res);
    setContentLengthHeader(start === end ? 0 : end - start + 1);
    setCacheControlHeaderNoCache(res);

    // Return 206 Partial Content status
    res.status(206);
    getStream(range).pipe(res);
  };
}

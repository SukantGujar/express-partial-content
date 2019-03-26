import { Range } from "./Range";
import { Stream } from "stream";
export interface Content {
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

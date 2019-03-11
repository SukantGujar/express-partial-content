import { Logger } from "./Logger";
import { RangeParserError } from "./RangeParserError";
import { Range } from "./Range";

const rangeRegEx = /bytes=([0-9]*)-([0-9]*)/;

export function parseRangeHeader(range: string, totalSize: number, logger: Logger): Range | null {
  logger.debug("Un-parsed range is: ", range);
  // 1. If range is not specified or the file is empty, return null.
  if (!range || range === null || range.length === 0 || totalSize === 0) {
    return null;
  }

  const splitRange = range.split(rangeRegEx);
  console.log("Parsed range is: ", JSON.stringify(splitRange));
  const [, startValue, endValue] = splitRange;
  let start = Number.parseInt(startValue);
  let end = Number.parseInt(endValue);

  // 2. Parse start and end values and ensure they are within limits.
  // 2.1. start: >= 0.
  // 2.2. end: >= 0, <= totalSize - 1

  let result = {
    start: Number.isNaN(start) ? 0 : Math.max(start, 0),
    end: Number.isNaN(end) ? totalSize - 1 : Math.min(Math.max(end, 0), totalSize - 1)
  };

  // 3.1. If end is not provided, set end to the last byte (totalSize - 1).
  if (!Number.isNaN(start) && Number.isNaN(end)) {
    logger.debug("End is not provided.");

    result.start = start;
    result.end = totalSize - 1;
  }

  // 3.2. If start is not provided, set it to the offset of last "end" bytes from the end of the file.
  //      And set end to the last byte.
  //      This way we return the last "end" bytes.
  if (Number.isNaN(start) && !Number.isNaN(end)) {
    logger.debug(`Start is not provided, "end" will be treated as last "end" bytes of the content.`);

    result.start = Math.max(totalSize - end, 0);
    result.end = totalSize - 1;
  }

  // 4. Handle invalid ranges.
  if (start < 0 || start > end || end > totalSize) {
    throw new RangeParserError(start, end);
  }

  logRange(logger, result);
  return result;
}

function logRange(logger: Logger, range: Range) {
  logger.debug("Range is: ", JSON.stringify(range));
}

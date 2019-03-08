export type Range = {
  start: number;
  end: number;
};

const rangeRegEx = /bytes=([0-9]*)-([0-9]*)/;

export class RangeParserError extends Error {
  constructor(start: any, end: any) {
    super(`Invalid start and end values: ${start}-${end}.`);
  }
}

export function parseRangeHeader(range: string, totalSize: number): Range | null {
  // 1. If range is not specified or the file is empty, return null.
  if (range === null || range.length === 0 || totalSize === 0) {
    return null;
  }

  const [startValue, endValue] = range.split(rangeRegEx);
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
    result.start = start;
    result.end = totalSize - 1;

    return result;
  }

  // 3.2. If start is not provided, set it to the offset of last "end" bytes from the end of the file.
  //      And set end to the last byte.
  //      This way we return the last "end" bytes.
  if (Number.isNaN(start) && !Number.isNaN(end)) {
    result.start = totalSize - end;
    result.end = totalSize - 1;

    return result;
  }

  // 4. Handle invalid ranges.
  if (start > end) {
    throw new RangeParserError(start, end);
  }

  return result;
}

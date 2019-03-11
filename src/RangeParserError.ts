export class RangeParserError extends Error {
  constructor(start: any, end: any) {
    super(`Invalid start and end values: ${start}-${end}.`);
  }
}

export const logger = {
  debug(message: string, extra?: any) {
    if (extra) {
      console.log(`[debug]: ${message}`, extra);
    } else {
      console.log(`[debug]: ${message}`);
    }
  }
};

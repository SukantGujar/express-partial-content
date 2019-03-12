import { promisify } from "util";
import fs from "fs";

export const statAsync = promisify(fs.stat);
export const existsAsync = promisify(fs.exists);

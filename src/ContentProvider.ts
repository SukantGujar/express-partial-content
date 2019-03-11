import { Request } from "express";
import { Content } from "./Content";
/**
 * @type {function (Request): Promise<Content>}
 */
export type ContentProvider = (req: Request) => Promise<Content>;

import * as utils from "./utils";
import * as ParseRangeHeaderExports from "./parseRangeHeader";
import { ContentDoesNotExistError } from "./ContentDoesNotExistError";
import { SinonSandbox, createSandbox, SinonStub, SinonSpy } from "sinon";
import { createPartialContentHandler } from "./createPartialContentHandler";
import { ContentProvider } from "./ContentProvider";
import { Logger } from "./Logger";
import { expect } from "chai";
import { Request, Response } from "express";
import { Content } from "./Content";
import { Stream } from "stream";
import { Range } from "./Range";

describe("createPartialContentHandler tests", () => {
  let sandbox: SinonSandbox;
  let logger: Logger;
  beforeEach(() => {
    sandbox = createSandbox();
    logger = {
      debug: sandbox.stub() as (message: string, extra?: any) => void
    };
  });
  afterEach(() => {
    sandbox.restore();
  });
  it("returns a handler", () => {
    const contentProvider = sandbox.stub().resolves({}) as ContentProvider;
    const handler = createPartialContentHandler(contentProvider, logger);
    expect(typeof handler === "function");
  });

  describe("handler tests", () => {
    let req: Request;
    let res: Response;
    let statusSpy: SinonSpy;
    let sendSpy: SinonSpy;
    let sendStatusSpy: SinonSpy;
    beforeEach(() => {
      req = {} as Request;
      res = {
        status: (code: number) => res,
        send: (message: string) => res,
        sendStatus: (code: number) => res,
        setHeader: sandbox.stub() as (name: string, value: string) => void
      } as Response;
      statusSpy = sandbox.spy(res, "status");
      sendSpy = sandbox.spy(res, "send");
      sendStatusSpy = sandbox.spy(res, "sendStatus");
    });
    it("invokes contentProvider with the specified request", async () => {
      const contentProvider = sandbox.stub().resolves({}) as ContentProvider;
      const handler = createPartialContentHandler(contentProvider, logger);
      try {
        await handler(req, res);
      } catch {}
      expect((contentProvider as SinonStub).calledOnceWith(req));
    });
    it("returns 404 if contentProvider throws ContentDoesNotExistError error", async () => {
      const error = new ContentDoesNotExistError("404-File not found!");
      const contentProvider = sandbox.stub().rejects(error) as ContentProvider;
      const handler = createPartialContentHandler(contentProvider, logger);
      try {
        await handler(req, res);
        expect(statusSpy.calledOnceWith(404));
        expect(sendSpy.calledOnceWith(error.message));
      } catch {
        expect(false);
      }
    });
    it("returns 500 if contentProvider throws any other error", async () => {
      const error = new Error("Something went wrong!");
      const contentProvider = sandbox.stub().rejects(error) as ContentProvider;
      const handler = createPartialContentHandler(contentProvider, logger);
      try {
        await handler(req, res);
        expect(sendStatusSpy.calledOnceWith(500));
      } catch {
        expect(false);
      }
    });
    it("returns 416 if parseRangeHeader throws RangeParserError error", async () => {
      const contentProvider = sandbox.stub().resolves({}) as ContentProvider;
      const handler = createPartialContentHandler(contentProvider, logger);
      req.headers = { range: "bytes=30-10" };
      try {
        await handler(req, res);
        expect(statusSpy.calledOnceWith(416));
      } catch {
        expect(false);
      }
    });
    it("returns 500 if parseRangeHeader throws other errors", async () => {
      const parseRangeHeaderStub = sandbox
        .stub(ParseRangeHeaderExports, "parseRangeHeader")
        .throws(new Error("Something went wrong!"));
      const contentProvider = sandbox.stub().resolves({}) as ContentProvider;
      const handler = createPartialContentHandler(contentProvider, logger);
      try {
        await handler(req, res);
        expect(sendStatusSpy.calledOnceWith(500));
      } catch {
        expect(false);
      }
    });
    it("returns correct response if range is not specified", async () => {
      const result = ({
        pipe() {
          return result;
        }
      } as any) as Stream;
      const content: Content = {
        fileName: "file.txt",
        totalSize: 10,
        mimeType: "text/plain",
        getStream(range?: Range) {
          return result;
        }
      };
      const pipeSpy = sandbox.spy(result, "pipe");
      const getStreamSpy = sandbox.spy(content, "getStream");
      const contentProvider = sandbox.stub().resolves(content) as ContentProvider;
      const handler = createPartialContentHandler(contentProvider, logger);
      const setContentTypeHeaderSpy = sandbox.spy(utils, "setContentTypeHeader");
      const setContentDispositionHeaderSpy = sandbox.spy(utils, "setContentDispositionHeader");
      const setAcceptRangesHeaderSpy = sandbox.spy(utils, "setAcceptRangesHeader");
      const setContentLengthHeaderSpy = sandbox.spy(utils, "setContentLengthHeader");
      const setContentRangeHeaderSpy = sandbox.spy(utils, "setContentRangeHeader");
      try {
        await handler(req, res);
        expect(setContentTypeHeaderSpy.calledOnceWith(content.mimeType, res));
        expect(setContentDispositionHeaderSpy.calledOnceWith(content.fileName, res));
        expect(setAcceptRangesHeaderSpy.calledOnceWith(res));
        expect(setContentLengthHeaderSpy.calledOnceWith(content.totalSize, res));
        expect(getStreamSpy.calledOnceWith());
        expect(pipeSpy.calledOnceWith(res));
        expect(setContentRangeHeaderSpy.notCalled);
      } catch {
        expect(false);
      }
    });
    it("returns correct partial response if range is specified", async () => {
      req.headers = {
        range: "bytes=0-5"
      };
      const result = ({
        pipe() {
          return result;
        }
      } as any) as Stream;
      const content: Content = {
        fileName: "file.txt",
        totalSize: 10,
        mimeType: "text/plain",
        getStream(range?: Range) {
          return result;
        }
      };
      const range = { start: 0, end: 5 };
      const pipeSpy = sandbox.spy(result, "pipe");
      const getStreamSpy = sandbox.spy(content, "getStream");
      const contentProvider = sandbox.stub().resolves(content) as ContentProvider;
      const handler = createPartialContentHandler(contentProvider, logger);
      const setContentTypeHeaderSpy = sandbox.spy(utils, "setContentTypeHeader");
      const setContentDispositionHeaderSpy = sandbox.spy(utils, "setContentDispositionHeader");
      const setAcceptRangesHeaderSpy = sandbox.spy(utils, "setAcceptRangesHeader");
      const setContentLengthHeaderSpy = sandbox.spy(utils, "setContentLengthHeader");
      const setContentRangeHeaderSpy = sandbox.spy(utils, "setContentRangeHeader");
      try {
        await handler(req, res);
        expect(setContentTypeHeaderSpy.calledOnceWith(content.mimeType, res));
        expect(setContentDispositionHeaderSpy.calledOnceWith(content.fileName, res));
        expect(setAcceptRangesHeaderSpy.calledOnceWith(res));
        expect(setContentRangeHeaderSpy.calledOnceWith(range, content.totalSize, res));
        expect(setContentLengthHeaderSpy.calledOnceWith(6, res));
        expect(getStreamSpy.calledOnceWith(range));
        expect(pipeSpy.calledOnceWith(res));
      } catch {
        expect(false);
      }
    });
  });
});

import { Request, Response } from "express";
import { expect } from "chai";
import sinon, { SinonStub, SinonSpy } from "sinon";

import {
  getHeader,
  setHeader,
  getRangeHeader,
  setContentTypeHeader,
  setContentLengthHeader,
  setAcceptRangesHeader,
  setContentDispositionHeader,
  setContentRangeHeader,
  setCacheControlHeaderNoCache
} from "./utils";

describe("utils tests", () => {
  let req: Request;
  let res: Response;
  beforeEach(() => {
    req = {
      headers: {
        "content-type": "application/octet-stream",
        range: "*"
      }
    } as Request;
    res = {
      setHeader: sinon.stub() as (name: string, value: string) => void
    } as Response;
  });
  describe("getHeader tests", () => {
    it("gets the specified header value if present", () => {
      const value = getHeader("content-type", req);
      expect(value).to.equal("application/octet-stream");
    });
    it("returns undefined if the specified header value is absent", () => {
      const value = getHeader("mime-type", req);
      expect(value).to.be.undefined;
    });
  });
  describe("setHeader tests", () => {
    it("invokes res.setHeader API with the specified name and value args", () => {
      const name = "Content-Type";
      const value = "application/octet-stream";
      setHeader(name, value, res);
      expect((res.setHeader as SinonStub).calledOnceWith(name, value));
    });
  });
  describe("getRangeHeader tests", () => {
    it("gets range header value", () => {
      const value = getRangeHeader(req);
      expect(value).to.equal("*");
    });
  });
  describe("setContentTypeHeader tests", () => {
    it("sets Content-Type header with specified value", () => {
      const value = "application/octet-stream";
      setContentTypeHeader(value, res);
      expect((res.setHeader as SinonStub).calledOnceWith("Content-Type", value));
    });
  });
  describe("setContentLengthHeader tests", () => {
    it("sets Content-Length header with specified value", () => {
      const value = 100;
      setContentLengthHeader(value, res);
      expect((res.setHeader as SinonStub).calledOnceWith("Content-Length", value));
    });
  });
  describe("setAcceptRangesHeader tests", () => {
    it("sets Accept-Ranges header with specified value", () => {
      const value = "bytes";
      setAcceptRangesHeader(res);
      expect((res.setHeader as SinonStub).calledOnceWith("Accept-Ranges", value));
    });
  });
  describe("setContentRangeHeader tests", () => {
    it("sets Content-Range header with specified value", () => {
      let range = { start: 10, end: 100 };
      const size = 1000;
      let value = `bytes ${range.start}-${range.end}/${size}`;
      setContentRangeHeader(range, size, res);
      expect((res.setHeader as SinonStub).calledOnceWith("Content-Range", value));
      range = null;
      value = `bytes */${size}`;
      setContentRangeHeader(range, size, res);
      expect((res.setHeader as SinonStub).calledOnceWith("Content-Range", value));
    });
  });
  describe("setContentDispositionHeader tests", () => {
    it("sets Content-Disposition header with specified value", () => {
      const fileName = "file.txt";
      const value = `attachment; filename="${fileName}"`;
      setContentDispositionHeader(fileName, res);
      expect((res.setHeader as SinonStub).calledOnceWith("Content-Disposition", value));
    });
  });
  describe("setCacheControlHeaderNoCache tests", () => {
    it("sets Cache-Control header with specified value", () => {
      const value = "no-cache";
      setCacheControlHeaderNoCache(res);
      expect((res.setHeader as SinonStub).calledOnceWith("Cache-Control", value));
    });
  });
});

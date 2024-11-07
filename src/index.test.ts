import { z } from "zod";
import { zodleware } from "./index"; // Assuming your middleware is in zodleware.ts
import { NextFunction, Request, Response } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { afterEach } from "node:test";

const mockRequest = <TParams = {}, TBody = {}, TQuery = {}>({
  params,
  body,
  query,
}: {
  params?: TParams;
  body?: TBody;
  query?: TQuery;
}) =>
  ({
    body,
    params,
    query,
  } as unknown as Request<TParams, any, TBody, TQuery>);

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockImplementation(() => res); // Chainable function
  res.json = vi.fn().mockImplementation(() => res);
  return res;
};

let mockNext: NextFunction;
const res = mockResponse();

describe("zodleware", () => {
  const paramSchema = z.object({
    id: z.string().uuid(),
  });
  const bodySchema = z.object({
    name: z.string().min(3),
  });
  const querySchema = z.object({
    search: z.string().optional(),
  });

  beforeEach(() => {
    mockNext = vi.fn();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });
  it("should pass validation and call next", async () => {
    const req = mockRequest({
      params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      body: { name: "John" },
      query: { search: "query" },
    });

    await zodleware({
      params: paramSchema,
      body: bodySchema,
      query: querySchema,
    })(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should pass validation when optional query field is missing", async () => {
    const req = mockRequest({
      params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      body: { name: "John" },
      query: {},
    });

    await zodleware({
      params: paramSchema,
      body: bodySchema,
      query: querySchema,
    })(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should fail validation when required `name` field is missing in body", async () => {
    const req = mockRequest({
      params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      body: {},
      query: { search: "query" },
    }) as any;

    const res = mockResponse();
    await zodleware({
      params: paramSchema,
      body: bodySchema,
      query: querySchema,
    })(req, res, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ path: "name", message: "Required" }],
    });
  });

  it("should fail validation when `search` is not a string in query", async () => {
    const req = mockRequest({
      params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      body: { name: "John" },
      query: { search: 123 }, // Invalid type for `search`
    }) as any;

    const res = mockResponse();
    await zodleware({
      params: paramSchema,
      body: bodySchema,
      query: querySchema,
    })(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ path: "search", message: "Expected string, received number" }],
    });
  });

  it("should pass validation with empty `query` when `query` schema is not provided", async () => {
    const req = mockRequest({
      params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      body: { name: "John" },
      query: {}, // Invalid type for `search`
    });

    const res = mockResponse();

    await zodleware({
      params: paramSchema,
      body: bodySchema,
      query: querySchema,
    })(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should fail validation when required `id` parameter is missing in params", async () => {
    const req = mockRequest({
      params: {}, // Missing `id`
      body: { name: "John" },
      query: { search: "query" },
    }) as any;

    const res = mockResponse();
    await zodleware({
      params: paramSchema,
      body: bodySchema,
      query: querySchema,
    })(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ path: "id", message: "Required" }],
    });
  });

  it("should pass validation with empty `body` when `body` schema is not provided", async () => {
    const req = mockRequest({
      params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      body: {},
      query: { search: "query" },
    });

    const res = mockResponse();
    await zodleware({
      params: paramSchema,
      query: querySchema,
    })(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

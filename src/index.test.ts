import { describe, it, expect, vi, afterEach } from "vitest";
import { z } from "zod";
import { zodleware } from "./index"; // Adjust the path as necessary
import type { Request, Response, NextFunction } from "express";

// Define schemas for testing
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const paramsSchema = z.object({
  userId: z.string().uuid(),
});

const querySchema = z.object({
  sortBy: z.enum(["name", "email"]).optional(),
});

// Mocking request, response, and next
const createMockRequest = (body = {}, params = {}, query = {}): Request =>
  ({
    body,
    params,
    query,
    get: vi.fn(),
    header: vi.fn(),
    accepts: vi.fn(),
  } as Partial<Request> as Request);

const createMockResponse = () => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
};

// Simplified mock next function
const createMockNext = (): NextFunction => vi.fn();

describe("zodleware middleware with mocks and spies", () => {
  afterEach(() => {
    vi.clearAllMocks(); // Clear all mocks after each test
  });

  it("should call next() for valid requests", async () => {
    const req = createMockRequest(
      { name: "John Doe", email: "john@example.com" },
      { userId: "123e4567-e89b-12d3-a456-426614174000" },
      { sortBy: "name" }
    );
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = zodleware({
      body: userSchema,
      params: paramsSchema,
      query: querySchema,
    });

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled(); // Verify that next() was called
    expect(res.status).not.toHaveBeenCalled(); // Verify that res.status was not called
  });

  it("should return a 400 for invalid email format", async () => {
    const req = createMockRequest(
      { name: "John Doe", email: "invalid-email" },
      { userId: "123e4567-e89b-12d3-a456-426614174000" },
      { sortBy: "name" }
    );
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = zodleware({
      body: userSchema,
      params: paramsSchema,
      query: querySchema,
    });

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled(); // Verify that next() was not called
    expect(res.status).toHaveBeenCalledWith(400); // Check status code
    expect(res.json).toHaveBeenCalled(); // Check if JSON response was called
  });

  it("should return a 400 for missing required fields", async () => {
    const req = createMockRequest(
      {},
      { userId: "123e4567-e89b-12d3-a456-426614174000" }
    );
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = zodleware({
      body: userSchema,
      params: paramsSchema,
      query: querySchema,
    });

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it("should return a 400 for invalid UUID in params", async () => {
    const req = createMockRequest(
      { name: "John Doe", email: "john@example.com" },
      { userId: "invalid-uuid" },
      { sortBy: "name" }
    );
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = zodleware({
      body: userSchema,
      params: paramsSchema,
      query: querySchema,
    });

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it("should return a 400 for invalid query parameter", async () => {
    const req = createMockRequest(
      { name: "John Doe", email: "john@example.com" },
      { userId: "123e4567-e89b-12d3-a456-426614174000" },
      { sortBy: "invalid" } // Invalid query parameter
    );
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = zodleware({
      body: userSchema,
      params: paramsSchema,
      query: querySchema,
    });

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });
});

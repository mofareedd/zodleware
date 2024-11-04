import type { NextFunction, Request, Response, RequestHandler } from "express";
import { ZodError, ZodSchema } from "zod";

// Define a type for the schemas
export type SchemaType = {
  body?: ZodSchema<any>;
  params?: ZodSchema<any>;
  query?: ZodSchema<any>;
};

// Middleware function to validate schemas
export const zodleware = <T extends SchemaType>(schema: T): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate body if schema is provided
      if (schema.body) {
        await schema.body.parseAsync(req.body);
      }

      // Validate params if schema is provided
      if (schema.params) {
        await schema.params.parseAsync(req.params);
      }

      // Validate query if schema is provided
      if (schema.query) {
        await schema.query.parseAsync(req.query);
      }

      // Call next to proceed to the next middleware
      return next();
    } catch (e: unknown) {
      // Custom error handling
      const errors =
        e instanceof ZodError
          ? e.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            }))
          : [{ message: "Invalid request data" }];

      res.status(400).json({ errors });
    }
  };
};

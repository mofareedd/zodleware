import type { RequestHandler } from "express";
import { AnyZodObject, z, ZodError, ZodSchema } from "zod";

/**
 * A reusable type for Express request handlers that validates `params`, `body`, and `query`
 * based on provided Zod schemas, and infers the types of each part in the request object.
 *
 * @typeParam TParams - A Zod schema type for `req.params`
 * @typeParam TBody - A Zod schema type for `req.body`
 * @typeParam TQuery - A Zod schema type for `req.query`
 */
export type RequestSchemaType<
  TParams extends ZodSchema,
  TBody extends ZodSchema,
  TQuery extends ZodSchema
> = RequestHandler<z.infer<TParams>, any, z.infer<TBody>, z.infer<TQuery>>;

// Middleware function to validate schemas
export const zodleware = <
  TParams extends AnyZodObject,
  TBody extends AnyZodObject,
  TQuery extends AnyZodObject
>(schema: {
  body?: TBody;
  params?: TParams;
  query?: TQuery;
}): RequestSchemaType<TParams, TBody, TQuery> => {
  return async (req, res, next): Promise<void> => {
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

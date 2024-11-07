# 🚀 Zod Middleware for Express

###### A lightweight 🧰 Zod-based middleware for Express, designed to simplify request validation with schema-based data parsing. Easily ensure that your API requests meet defined schemas and handle invalid input with minimal code.

### 📦 Installation

Install the library using npm or yarn:

```bash
npm install zodleware
# or
pnpm add zodleware
# or
yarn add zodleware

```

### 📖 Usage

Use this middleware to validate body, params, and query data in Express routes by defining schemas with Zod. The middleware will automatically respond with a 400 status code and detailed error messages if validation fails.

### 🌟 Example

Below is an example of using zodleware to validate incoming request data in an Express route.

1. Define Zod Schemas: Create validation schemas for body, params, or query as needed.
2. Apply Middleware: Use zodleware to add validation in your route.

```js
import express from "express";
import { z } from "zod";
import { zodleware } from "zodleware";

const app = express();
app.use(express.json());

// Define schemas for validation
const bodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
});

const paramsSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

const querySchema = z.object({
  referrer: z.string().optional(),
});

// Use the middleware in a route
app.post(
  "/users/:userId",
  zodleware({
    body: bodySchema,
    params: paramsSchema,
    query: querySchema,
  }),
  (req, res) => {
 // TypeScript infers req.body as { name: string, age: number }
  const { name, age } = req.body; // No need to manually type 'req.body'

  res.send(`User ${name}, age ${age}`);
  }
);
```

### 🚨 Error Handling

If validation fails, Zodleware will return a `400 Bad Request` status with an error message indicating what went wrong. The error response format is as follows:

```json
{
   "errors": [
       {
           "path": "body.name",
           "message": "Expected string, received number"
       },
       ...
   ]
}

```

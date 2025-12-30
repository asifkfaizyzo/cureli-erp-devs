// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\middleware\validate.js

import { fail } from "../utils/response.js";

export const validateBody = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.validated = parsed;
    return next();
  } catch (err) {
    return fail(res, "Validation failed", 400, err.errors);
  }
};

// ✅ FIXED: Handle nested schema structure (body, query, params)
export const validate = (schema) => (req, res, next) => {
  try {
    // Parse the full request object against the schema
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Store validated data back on request
    if (parsed.body) {
      req.body = parsed.body;
      req.validated = parsed.body;
    }
    if (parsed.query) {
      req.query = parsed.query;
      req.validatedQuery = parsed.query;
    }
    if (parsed.params) {
      req.params = parsed.params;
      req.validatedParams = parsed.params;
    }

    return next();
  } catch (err) {
    console.error("Validation error:", JSON.stringify(err.errors, null, 2));
    
    // Format error messages nicely
    const messages = err.errors?.map((e) => {
      const path = e.path.join(".");
      return `${path}: ${e.message}`;
    }).join(", ") || "Validation failed";
    
    return fail(res, messages, 400, err.errors);
  }
};

export function validateQuery(schema) {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.validated = { ...req.validated, ...validated };
      next();
    } catch (error) {
      if (error.errors) {
        const messages = error.errors.map((e) => e.message).join(", ");
        return fail(res, messages, 400);
      }
      return fail(res, "Invalid query parameters", 400);
    }
  };
}
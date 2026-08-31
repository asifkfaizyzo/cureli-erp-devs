// src/middleware/validate.js
import { fail } from "../utils/response.js";

export const validateBody = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body || {});
    req.body = parsed;
    req.validated = parsed;
    return next();
  } catch (err) {
    const message = err?.errors?.[0]?.message || "Validation failed";
    return fail(res, message, 400, err.errors);
  }
};

// Flexible validate function for body, query, or params
export const validate = (schema, source = "body") => (req, res, next) => {
  try {
    const data = req[source] || {};
    const parsed = schema.parse(data);

    if (source === "body") {
      req.body = parsed;
      req.validated = parsed;
    } else if (source === "query") {
      req.query = parsed;
      req.validatedQuery = parsed;
    } else if (source === "params") {
      req.params = parsed;
      req.validatedParams = parsed;
    }
    
    return next();
  } catch (err) {
    const message = err?.errors?.[0]?.message || "Validation failed";
    return fail(res, message, 400, err.errors);
  }
};

export function validateQuery(schema) {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.query || {});
      req.query = validated;
      req.validated = { ...req.validated, ...validated };
      next();
    } catch (error) {
      const message = error.errors?.map((e) => e.message).join(", ") || "Invalid query parameters";
      return fail(res, message, 400, error.errors);
    }
  };
}
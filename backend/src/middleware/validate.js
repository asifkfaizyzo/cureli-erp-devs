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

// New flexible validate function that can validate body, query, or params
export const validate = (schema, source = "body") => (req, res, next) => {
  try {
    const data = req[source];
    const parsed = schema.parse(data);

    
    // Store validated data appropriately
    if (source === "body") {
      req.validated = parsed;
    } else if (source === "query") {
      req.validatedQuery = parsed;
    } else if (source === "params") {
      req.validatedParams = parsed;
    }
    
    return next();
  } catch (err) {
    return fail(res, "Validation failed", 400, err.errors);
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
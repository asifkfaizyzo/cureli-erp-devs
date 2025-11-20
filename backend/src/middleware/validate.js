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


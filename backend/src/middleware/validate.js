// zod validation middleware
export const validateBody = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.validated = parsed;
    return next();
  } catch (err) {
    // zod error -> 400
    return res.status(400).json({ success: false, message: "Validation failed", errors: err.errors });
  }
};

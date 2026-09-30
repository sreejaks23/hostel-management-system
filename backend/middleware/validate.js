import { validationResult } from "express-validator";

// Runs after a chain of express-validator checks; if any failed, responds
// with 400 and a list of field-level messages instead of letting the
// request reach the controller.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    const message = errors
      .array()
      .map((e) => `${e.path}: ${e.msg}`)
      .join(", ");
    throw new Error(message);
  }
  next();
};

export default validate;

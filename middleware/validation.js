const Joi = require("joi");

const registerValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  });

  return schema.validate(data);
};

const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  return schema.validate(data);
};

const taskValidation = (data) => {
  const schema = Joi.object({
    title: Joi.string().max(100).required().messages({
      "string.empty": "Task title is required",
      "string.max": "Task title cannot exceed 100 characters",
      "any.required": "Task title is required",
    }),
    description: Joi.string().max(500).allow(""),
    dueDate: Joi.date().optional().allow(""),
  });

  return schema.validate(data);
};

module.exports = {
  registerValidation,
  loginValidation,
  taskValidation,
};

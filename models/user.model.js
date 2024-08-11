const mongoose = require("mongoose");
const Joi = require("joi");

mongoose.connect("mongodb://localhost:27017/phindAi");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const joiValidation = (data) => {
  const userValidationSchema = Joi.object().keys({
    name: Joi.string().required().messages({
      "string.empty": "Name cannot be empty",
      "any.required": "Name is required",
    }),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        "string.empty": "Email cannot be empty",
        "any.required": "Email is required",
        "string.email": "Invalid email address",
      }),
    password: Joi.string().required().messages({
      "string.empty": "Password cannot be empty",
      "any.required": "Password is required",
    }),
  });
  const { error } = userValidationSchema.validate(data);
  if (error) {
    const { details } = error;
    const message = details.map((i) => i.message).join(",");
    throw new Error(message); // or return an error response
  }
  return data;
};

module.exports = {
  userModel: mongoose.model("User", userSchema),
  joiValidation,
};

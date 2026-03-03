import Joi from 'joi';

export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  bio: Joi.string().max(500).optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const createPostSchema = Joi.object({
  caption: Joi.string().max(2200).optional(),
  mediaType: Joi.string().valid('image', 'video', 'carousel').default('image'),
});

export const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
  parentId: Joi.string().uuid().optional(),
});

export const updateProfileSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).optional(),
  bio: Joi.string().max(500).optional(),
});

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }
    next();
  };
};
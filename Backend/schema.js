import Joi from "joi";


export const userschema = Joi.object({
    username: Joi.string().alphanum().min(3).max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    age: Joi.number().integer().min(13).max(120)
});

export const avatarschema = Joi.object({
    name: Joi.string().trim(),
    origin: Joi.string().trim(), 
    image: Joi.object({
            url: Joi.string().allow("", null).required()
        }).optional()
}); 

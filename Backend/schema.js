import Joi from "joi";


export const userschema = Joi.object({
    username: Joi.string().alphanum().min(3).max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    age: Joi.number().integer().min(13).max(120),
    bio: Joi.string().max(160).allow("", null)
});

export const avatarschema = Joi.object({
    name: Joi.string().trim(),
    origin: Joi.string().trim(), 
    image: Joi.object({
            url: Joi.string().allow("", null).required()
        }).optional()
}); 

export const postschema = Joi.object({
    description: Joi.string().max(500).allow("", null),
    imageUrl: Joi.string().uri().required(),
    imagePublicId: Joi.string().required()
});
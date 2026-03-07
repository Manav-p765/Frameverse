import Joi from "joi";


export const userschema = Joi.object({
    username: Joi.string().alphanum().min(3).max(20),
    email: Joi.string().email(),
    password: Joi.string().min(8).optional(),
    age: Joi.number().integer().min(13).max(120),
    bio: Joi.string().max(160).allow("", null),
    profilePic: Joi.string().allow("", null)
}).min(1); // At least one field should be present for update

export const avatarschema = Joi.object({
    name: Joi.string().trim(),
    origin: Joi.string().trim(),
    image: Joi.object({
        url: Joi.string().allow("", null).required()
    }).optional()
});

export const postschema = Joi.object({
    description: Joi.string().max(500).allow("", null),
    location: Joi.string().max(100).allow("", null),
    image: Joi.object({
        url: Joi.string().uri().required(),
        public_id: Joi.string().required()
    })
});

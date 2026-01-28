import user from "./models/user.js";
import Avatar from "./models/avatar.js";
import { userschema, avatarschema } from "./schema.js";
import ExpressErrors from "./utils/expressErrors.js";
import jwt from "jsonwebtoken";


//validating user server side errors
export const validateuser = (req, res, next) => {
    let { error } = userschema.validate(req.body);
    if (error) {
        let errmsg = error.details.map((el) => el.message).join(",");
        throw new ExpressErrors(400, errmsg);
    }
    else {
        next();
    }
};

//validating avatar server side errors
export const validateavatar = (req, res, next) => {
    let { error } = avatarschema.validate(req.body);
    if (error) {
        let errmsg = error.details.map((el) => el.message).join(",");
        throw new ExpressErrors(400, errmsg);
    }
    else {
        next();
    }
};



export const isLoggedIn = (req, res, next) => {

    const {token} = req.cookies;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};


export const isOwner = (req, res, next) => {
    if (req.userId !== req.params.id) {
        return next(new ExpressErrors(403, "You are not allowed to do this"));
    }
    next();
};

const isAvatarOwner = async (req, res, next) => {
    const avatar = await Avatar.findById(req.params.id);

    if (!avatar) {
        return next(new ExpressErrors(404, "Avatar not found"));
    }

    if (avatar.owner.toString() !== req.userId) {
        return next(new ExpressErrors(403, "You are not allowed to do this"));
    }

    next();
};
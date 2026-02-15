import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from "bcrypt";

const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [20, 'Username cannot exceed 20 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validator: {
            validator: validator.isEmail,
            message: 'Invalid email format'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false,
    },
    age: {
        type: Number,
        min: [13, 'Age must be at least 13'],
        max: [120, 'Age must be below 120'],
        validator: {
            validator: Number.isInteger,
            message: 'Age must be an integer'
        }
    },
    avatar: [{
        type: Schema.Types.ObjectId,
        ref: "Avatar",
    }],
    profilePic: {
        type: String,   // store file path or Cloudinary URL
        default: ""
    },
    posts: [{
        type: Schema.Types.ObjectId,
        ref: "Post",
    }],
    followers: [{
        type: Schema.Types.ObjectId,
        ref: "User",
    }],
    following: [{
        type: Schema.Types.ObjectId,
        ref: "User",
    }],
    bio: {
        type: String,
        maxlength: [160, 'Bio cannot exceed 160 characters']
    },
});



userSchema.pre('save', async function (next) {

    if (!this.isModified('password')) {
        return;
    }

    const saltrounds = 12;
    this.password = await bcrypt.hash(this.password, saltrounds);
});

const User = mongoose.model('User', userSchema);
export default User;
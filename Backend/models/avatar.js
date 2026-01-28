import mongoose from "mongoose";

const Schema = mongoose.Schema;

const avatarSchema = new Schema({
    name: {
        type: String,
        trim: true
    },
    origin: {
        type: String,
        trim: true
    },
    image: [
    {
      filename: String,
      url: {
        type: String,
      }
    }
  ],
});

const Avatar = mongoose.model('Avatar', avatarSchema);

export default Avatar;
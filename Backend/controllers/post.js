import Post from "../models/post.js";
import User from "../models/user.js";


export const createPost = async (req, res) => {
    const { description, imageUrl, imagePublicId } = req.body;

    try {
        const newPost = new Post({
            owner: req.userId,
            description,
            image: {
                url: imageUrl,
                public_id: imagePublicId
            }
        });

        await User.findByIdAndUpdate(req.userId, {
            $push: { posts: newPost._id },
        });
        await newPost.save();
        res.status(201).json({ message: "Post created successfully", post: newPost });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

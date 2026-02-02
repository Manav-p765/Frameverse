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

export const getFeed = async (req, res) => {
    const user = await User.findById(req.user).select("following");

    const followingIds = user.following.map(id => id.toString());

    const feed = await Post.aggregate([
        {
            $addFields: {
                priority: {
                    $cond: [
                        { $in: ["$owner", followingIds] },
                        1, // followed users
                        0  // others
                    ]
                }
            }
        },
        {
            $sort: {
                priority: -1,
                createdAt: -1
            }
        },
        {
            $limit: 50
        }
    ]);

    res.json(feed);
};

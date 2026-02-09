import React, { useState, useEffect } from "react";
import api from "../services/post.service";
import PostCard from "../components/Postcard";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await api.get("/user/feed");
        setPosts(res.data);
      } catch (err) {
        console.error("Failed to fetch feed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#18181c] flex items-center justify-center">
        <p className="text-gray-400">Loading feed...</p>
      </div>
    );
  }

  return (
    <div className=" flex justify-center py-6">
      <div className="w-full max-w-xl space-y-6">
        {posts.length === 0 ? (
          <p className="text-gray-400 text-center">No posts found</p>
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;

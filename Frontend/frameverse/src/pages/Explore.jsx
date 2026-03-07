import { useState, useEffect } from "react";
import SearchBar from "../components/explore/SearchBar";
import ExploreGrid from "../components/explore/ExploreGrid";
import PostViewer from "../components/profile/PostViewer";
import { postAPI } from "../services/api";
import api from "../services/post.service";

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Fetch current user for PostCard
    api.get("/user/auth/me")
      .then((r) => setCurrentUser(r.data))
      .catch(() => { });

    // Fetch explore posts
    postAPI
      .getExplorePosts(30)
      .then((data) => setPosts(data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const handlePostClick = (index) => {
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  const handleLikeToggle = async (postId) => {
    try {
      const res = await api.post(`/post/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, likeCount: res.data.likeCount, likedByCurrentUser: res.data.liked }
            : p
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-5xl mx-auto pt-4 px-4">
        {/* Search */}
        <SearchBar />

        {/* Grid */}
        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-[#5a5a6a]">
              <span className="text-4xl block mb-3">🎬</span>
              <p className="text-sm">No posts to explore yet</p>
            </div>
          ) : (
            <ExploreGrid posts={posts} onPostClick={handlePostClick} />
          )}
        </div>
      </div>

      {/* Post viewer overlay */}
      {viewerOpen && (
        <PostViewer
          posts={posts}
          initialIndex={selectedIndex}
          onClose={() => setViewerOpen(false)}
          onLikeToggle={handleLikeToggle}
          currentUser={currentUser}
          profile={posts[selectedIndex]?.owner}
        />
      )}
    </div>
  );
};

export default Explore;
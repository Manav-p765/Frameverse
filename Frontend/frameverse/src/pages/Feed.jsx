import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PostCard from "../components/Postcard";
import PostLightbox from "../components/Postlightbox";
import api from "../services/post.service";

const Feed = () => {
  const navigate = useNavigate();

  // State
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Refs
  const observerTarget = useRef(null);
  const pageRef = useRef(0);

  // Fetch posts
  const fetchPosts = async (page) => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const res = await api.get(
        `/user/feed?limit=10&depth=${page}`
      );

      const newPosts = res.data.posts || [];

      console.log(newPosts);

      setPosts((prev) => [...prev, ...newPosts]);

      if (newPosts.length < 10) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPosts(0);
  }, []);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loading &&
          hasMore &&
          posts.length > 0
        ) {
          pageRef.current += 1;
          fetchPosts(pageRef.current);
        }
      },
      { threshold: 1 }
    );

    const target = observerTarget.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [loading, hasMore, posts.length]);

  // Handlers
  const onUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const onDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;

    const previousPosts = [...posts];

    const updatedPosts = posts.filter((p) => p._id !== postId);
    setPosts(updatedPosts);

    try {
      await api.delete(`/post/${postId}`);
    } catch (err) {
      setPosts(previousPosts);
      console.error("Failed to delete post:", err);
      alert("Failed to delete post");
    }
  };

  const handleImageClick = (post, imageIndex = 0) => {
    setSelectedPost(post);
    setLightboxIndex(imageIndex);
  };

  const closeLightbox = () => {
    setSelectedPost(null);
    setLightboxIndex(0);
  };

  return (
    <div className="min-h-screen bg-[#18181c] mt-15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Initial loading */}
        {initialLoading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* No posts */}
        {!initialLoading && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No posts yet
            </h3>
            <p className="text-gray-400 text-center max-w-sm">
              Follow more users to see their posts in your feed
            </p>
          </div>
        )}

        {/* Posts */}
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-0 lg:max-w-2xl xl:max-w-2xl">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onUserClick={onUserClick}
              onImageClick={handleImageClick}
              onDeletePost={onDeletePost}
            />
          ))}
        </div>

        {/* Loading more */}
        {loading && !initialLoading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Observer target */}
        {hasMore && !initialLoading && (
          <div ref={observerTarget} className="h-10" />
        )}

        {/* End message */}
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            You've reached the end
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedPost && (
        <PostLightbox
          post={selectedPost}
          initialIndex={lightboxIndex}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
};

export default Feed;

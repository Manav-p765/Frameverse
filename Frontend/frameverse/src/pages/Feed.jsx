import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PostCard from "../components/posts/PostCard";
import PostLightbox from "../components/posts/PostLightbox";
import NotificationSidebar from "../components/NotificationSidebar";
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
      const res = await api.get(`/user/feed?limit=10&depth=${page}`);
      const newPosts = res.data.posts || [];

      setPosts((prev) => {
        const existingIds = new Set(prev.map(p => p._id));
        const uniquePosts = newPosts.filter(p => !existingIds.has(p._id));
        return [...prev, ...uniquePosts];
      });

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
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loading &&
          hasMore &&
          posts.length > 0 &&
          !isFetchingRef.current
        ) {
          isFetchingRef.current = true; // 🚫 block repeats
          pageRef.current += 1;
          fetchPosts(pageRef.current).finally(() => {
            isFetchingRef.current = false; // ✅ allow next time
          });
        }
      },
      { rootMargin: "200px", threshold: 0 }
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



  const handleImageClick = (post, imageIndex = 0) => {
    setSelectedPost(post);
    setLightboxIndex(imageIndex);
  };

  const closeLightbox = () => {
    setSelectedPost(null);
    setLightboxIndex(0);
  };

  const onLikeToggle = async (postId) => {
    try {
      const res = await api.post(`/post/${postId}/like`);

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
              ...post,
              likesCount: res.data.likesCount,
              likedByCurrentUser: res.data.liked,
            }
            : post
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Two-column layout on desktop: feed left, notifications right */}
        <div className="flex gap-8">

          {/* Left column — posts */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-6 mt-2">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight bg-clip-text text-transparent bg-linear-to-r from-brand-purple to-brand-pink">
                Recent posts
              </h1>
              <p className="text-text-secondary text-base">Updates from the creators you follow</p>
            </div>

            {/* Initial loading */}
            {initialLoading && (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-2 border-border-color border-t-white rounded-full animate-spin" />
              </div>
            )}

            {/* No posts */}
            {!initialLoading && posts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-6xl mb-4">📸</div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  No posts yet
                </h3>
                <p className="text-text-secondary text-center max-w-sm">
                  Follow more users to see their posts in your feed
                </p>
              </div>
            )}

            {/* Posts Grid - Rendered as two vertical columns on desktop, single on mobile. */}
            {/* Mobile View (Hidden on md+) */}
            <div className="flex flex-col gap-6 w-full md:hidden">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onUserClick={onUserClick}
                  onImageClick={handleImageClick}
                  onLikeToggle={onLikeToggle}
                />
              ))}
            </div>

            {/* Desktop View (Hidden on sm) - Split into two distinct columns */}
            <div className="hidden md:flex gap-6 w-full items-start">
              {/* Left Column */}
              <div className="flex flex-col gap-6 flex-1 min-w-0">
                {posts.filter((_, i) => i % 2 === 0).map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onUserClick={onUserClick}
                    onImageClick={handleImageClick}
                    onLikeToggle={onLikeToggle}
                  />
                ))}
              </div>
              {/* Right Column */}
              <div className="flex flex-col gap-6 flex-1 min-w-0">
                {posts.filter((_, i) => i % 2 !== 0).map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onUserClick={onUserClick}
                    onImageClick={handleImageClick}
                    onLikeToggle={onLikeToggle}
                  />
                ))}
              </div>
            </div>

            {/* Loading more */}
            {loading && !initialLoading && (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-border-color border-t-white rounded-full animate-spin" />
              </div>
            )}

            {/* Observer target */}
            {hasMore && !initialLoading && (
              <div ref={observerTarget} className="h-10" />
            )}

            {/* End message */}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-8 mb-8 text-text-secondary text-sm">
                You've reached the end
              </div>
            )}
          </div>

          {/* Right column — Notifications sidebar (desktop only) */}
          <div className="hidden lg:block w-[30%] max-w-[320px] shrink-0">
            <div className="sticky top-4 pt-4 space-y-6">
              <NotificationSidebar />
            </div>
          </div>

        </div>
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

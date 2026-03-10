import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PostCard from "../components/posts/PostCard";
import PostLightbox from "../components/posts/PostLightbox";
import NotificationSidebar from "../components/NotificationSidebar";
import SuggestedUsersSection from "../components/SuggestedUsersSection";
import CommentPanel from "../components/comments/CommentPanel";
import api from "../services/post.service";
import SEOHead from "../components/SEOHead";

const Feed = () => {
  const navigate = useNavigate();

  // State
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  // Sync current user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // Refs
  const observerTarget = useRef(null);
  const pageRef = useRef(1);

  // Fetch posts
  const fetchPosts = async (page) => {
    if (loading || (!hasMore && page !== 1)) return;

    setLoading(true);

    try {
      const res = await api.get(`/user/feed?limit=10&page=${page}`);
      const newPosts = res.data.posts || [];

      setPosts((prev) => {
        const existingIds = new Set(prev.map(p => p._id));
        const uniquePosts = newPosts.filter(p => !existingIds.has(p._id));
        return [...prev, ...uniquePosts];
      });

      if (newPosts.length === 0 || newPosts.length < 10) {
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
    fetchPosts(1);
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
          isFetchingRef.current = true;
          const nextPage = pageRef.current + 1;
          pageRef.current = nextPage;
          fetchPosts(nextPage).finally(() => {
            isFetchingRef.current = false;
          });
        }
      },
      { rootMargin: "300px", threshold: 0 }
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
              likeCount: res.data.likeCount,
              likedByCurrentUser: res.data.liked,
            }
            : post
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const onDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/post/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));

      // ✅ CLOSE LIGHTBOX IF DELETED POST IS ACTIVE
      if (selectedPost?._id === postId) {
        setSelectedPost(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete post");
    }
  };

  const onPostUpdate = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  const onCommentAdded = (postId) => {
    setPosts(prev => prev.map(p => p._id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
  };

  const onCommentDeleted = (postId) => {
    setPosts(prev => prev.map(p => p._id === postId ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) - 1) } : p));
  };

  return (
    <div className="min-h-screen bg-bg-primary mt-10">
      <SEOHead
        title="Feed | Frameverse — The Social Platform for Student Developers"
        description="See the latest coding updates, GitHub commits, and LeetCode solves from the student developer community."
        canonical="https://frameverse.online/"
      />
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

            {/* Posts Feed - Single Column with side-by-side comments on desktop */}
            <div className="flex flex-col gap-10 w-full mb-10">
              {posts.map((post) => (
                <div key={post._id} className="w-full">
                  <PostCard
                    post={post}
                    onUserClick={onUserClick}
                    onImageClick={handleImageClick}
                    onLikeToggle={onLikeToggle}
                    onDeletePost={onDeletePost}
                    onPostUpdate={onPostUpdate}
                    onCommentAdded={onCommentAdded}
                    onCommentDeleted={onCommentDeleted}
                    currentUser={currentUser}
                  />
                </div>
              ))}
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
          <div className="hidden xl:flex flex-col w-[30%] max-w-[320px] shrink-0 h-[calc(100vh-2rem)] sticky top-4">
            <div
              className="flex-1 overflow-hidden pb-2"
              style={{ flexBasis: '60%', flexGrow: 0 }}
            >
              <NotificationSidebar limit={6} />
            </div>
            <div
              className="flex-1 overflow-y-auto no-scrollbar pt-2 border-t border-white/5"
              style={{ flexBasis: '40%', flexGrow: 0 }}
            >
              <SuggestedUsersSection className="" />
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

      <style>{`
        .glass-morphism {
          background: rgba(15, 15, 15, 0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
};

export default Feed;

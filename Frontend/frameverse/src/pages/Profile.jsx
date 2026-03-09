import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/post.service";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfilePosts from "../components/profile/ProfilePosts";
import AutoProgressPosts from "../components/profile/AutoProgressPosts";
import ShareProfileModal from "../components/profile/ShareProfileModal";
import SkeletonLoader from "../components/profile/SkeletonLoader";
import PostViewer from "../components/profile/PostViewer";

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [posts, setPosts] = useState([]);
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("posts");

  const observerRef = useRef();
  const loadMoreRef = useRef(null);

  const POSTS_PER_PAGE = 9;

  // ✅ FIXED: get current user id from localStorage to compare properly
  const storedUser = localStorage.getItem("user");
  const loggedInUser = storedUser ? JSON.parse(storedUser) : null;
  const loggedInUserId = loggedInUser?._id || loggedInUser?.id;

  // Own profile = no userId param OR the userId matches the logged-in user
  const isOwnProfile = !userId || userId === loggedInUserId;

  useEffect(() => {
    if (storedUser) {
      setCurrentUser(loggedInUser);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const endpoint = isOwnProfile ? "/user/profile" : `/user/profile/${userId}`;
        const res = await api.get(endpoint);

        setProfile(res.data);

        const sortedPosts = [...(res.data.posts || [])].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setPosts(sortedPosts);

        // Only check following state for OTHER users' profiles
        if (!isOwnProfile) {
          try {
            const meRes = await api.get("/user/profile");
            // ✅ FIXED: use .some() with toString() — includes() fails with ObjectIds
            const following = meRes.data.following || [];
            setIsFollowing(
              following.some((entry) => {
                const id = entry?._id ?? entry; // handles both {_id, username...} AND raw "abc123"
                return id?.toString() === userId;
              })
            );
          } catch {
            setIsFollowing(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError(
          err.response?.status === 404
            ? "User not found"
            : "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    setProfile(null);
    setPosts([]);
    setDisplayedPosts([]);
    setCurrentPage(1);
    setHasMore(true);
    setIsFollowing(false);
    fetchProfile();
  }, [userId, isOwnProfile]);

  // Split posts by type
  const userPosts = useMemo(() => posts.filter(p => p.postType !== 'auto-progress'), [posts]);
  const autoPosts = useMemo(() => posts.filter(p => p.postType === 'auto-progress'), [posts]);
  const activePosts = activeTab === "posts" ? userPosts : autoPosts;

  useEffect(() => {
    if (!activePosts.length) {
      setDisplayedPosts([]);
      setHasMore(false);
      return;
    }

    const endIndex = currentPage * POSTS_PER_PAGE;
    const newDisplayedPosts = activePosts.slice(0, endIndex);

    setDisplayedPosts(newDisplayedPosts);
    setHasMore(endIndex < activePosts.length);
  }, [activePosts, currentPage]);

  // Reset page when tab switches
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore) {
        setLoadingMore(true);
        setTimeout(() => {
          setCurrentPage((prev) => prev + 1);
          setLoadingMore(false);
        }, 500);
      }
    }, options);

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore]);

  const handleUpdateProfile = async (updateData) => {
    try {
      const formData = new FormData();
      formData.append("username", updateData.username);
      formData.append("bio", updateData.bio);

      if (updateData.profilePicFile) {
        formData.append("profilePic", updateData.profilePicFile);
      }

      const response = await api.put("/user/updateProfile", formData);

      const updatedUser = response.data.user;
      setProfile(updatedUser);

      // ✅ SYNC WITH LOCALSTORAGE
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const currentUserData = JSON.parse(storedUser);
        // Preserve other fields if necessary (like token etc depending on structure)
        const newUserData = { ...currentUserData, ...updatedUser };
        localStorage.setItem("user", JSON.stringify(newUserData));
        setCurrentUser(newUserData);
      }
    } catch (error) {
      console.error("Update profile error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to update profile"
      );
    }
  };

  const handleFollowToggle = async () => {
    if (followLoading) return;
    setFollowLoading(true);

    const nextFollowing = !isFollowing;
    const previousFollowers = profile.followers;

    setIsFollowing(nextFollowing);
    setProfile((prev) => {
      const updatedFollowers = nextFollowing
        ? [...prev.followers, { _id: loggedInUserId, username: loggedInUser?.username, bio: loggedInUser?.bio, profilePic: loggedInUser?.profilePic }]
        : prev.followers.filter((entry) => (entry?._id ?? entry)?.toString() !== loggedInUserId);

      // Optimistic update for counters
      const inc = nextFollowing ? 1 : -1;
      return {
        ...prev,
        followers: updatedFollowers,
        followersCount: (prev.followersCount || 0) + inc
      };
    });

    try {
      const res = await api.post(`/user/${nextFollowing ? "follow" : "unfollow"}/${userId}`);
      // Sync with server authoritative count
      if (res.data.followersCount !== undefined) {
        setProfile(prev => ({ ...prev, followersCount: res.data.followersCount }));
      }
    } catch (err) {
      setIsFollowing(!nextFollowing);
      setProfile((prev) => ({ ...prev, followers: previousFollowers }));
      console.error("Failed to toggle follow:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;

    const prevPosts = posts;
    const prevDisplayed = displayedPosts;

    setPosts((prev) => prev.filter((p) => p._id !== postId));
    setDisplayedPosts((prev) => prev.filter((p) => p._id !== postId));

    // ✅ CLOSE VIEWER IF DELETED POST IS ACTIVE
    if (viewerOpen && activePosts[selectedIndex]?._id === postId) {
      setViewerOpen(false);
    }

    try {
      await api.delete(`/post/${postId}`);
    } catch (err) {
      setPosts(prevPosts);
      setDisplayedPosts(prevDisplayed);
      console.error("Failed to delete post:", err);
      alert("Failed to delete post");
    }
  };

  const handlePostClick = (post) => {
    const index = activePosts.findIndex((p) => p._id === post._id);
    setSelectedIndex(index);
    setViewerOpen(true);
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

  const onPostUpdate = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
    setDisplayedPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  const handleUserClick = (user) => {
    navigate(`/profile/${user._id}`);
  };


  if (loading) return <SkeletonLoader />;

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">{error}</h2>
          <p className="text-text-secondary mb-6">
            This user may not exist or has been removed
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 bg-brand-purple hover:opacity-90 text-text-primary rounded-lg font-medium transition-colors"
          >
            ← Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-4xl mx-auto mt-6">
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          followLoading={followLoading}
          onFollowToggle={handleFollowToggle}
          onShareClick={() => setShowShareModal(true)}
          onUpdateProfile={handleUpdateProfile}
          onUserClick={handleUserClick}

          // ✅ Pass current user id so FollowList can hide Follow btn for self
          currentUserId={loggedInUserId}
        />

        {/* ── Tab Bar ── */}
        <div className="flex border-b border-border-color px-4 mb-1">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors relative ${activeTab === "posts"
              ? "text-text-primary"
              : "text-text-secondary hover:text-text-secondary"
              }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              Posts
              {userPosts.length > 0 && (
                <span className="text-xs text-text-secondary">({userPosts.length})</span>
              )}
            </span>
            {activeTab === "posts" && (
              <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-white rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("auto")}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors relative ${activeTab === "auto"
              ? "text-text-primary"
              : "text-text-secondary hover:text-text-secondary"
              }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <span className="text-sm">⚡</span>
              Auto-Progress
              {autoPosts.length > 0 && (
                <span className="text-xs text-text-secondary">({autoPosts.length})</span>
              )}
            </span>
            {activeTab === "auto" && (
              <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-amber-500 to-brand-orange rounded-full" />
            )}
          </button>
        </div>

        <div className="px-4">
          {activeTab === "posts" ? (
            <ProfilePosts
              posts={displayedPosts}
              isOwnProfile={isOwnProfile}
              onDeletePost={handleDeletePost}
              profile={profile}
              onPostClick={handlePostClick}
              onPostUpdate={onPostUpdate}
            />
          ) : (
            <AutoProgressPosts
              posts={displayedPosts}
              onPostClick={handlePostClick}
            />
          )}
        </div>

        {viewerOpen && (
          <PostViewer
            posts={activePosts}
            initialIndex={selectedIndex}
            profile={profile}
            onClose={() => setViewerOpen(false)}
            onDeletePost={handleDeletePost}
            onLikeToggle={onLikeToggle}
            onPostUpdate={onPostUpdate}
            currentUser={currentUser}
          />
        )}

        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {loadingMore && (
              <div className="flex gap-2">
                <div
                  className="w-2 h-2 bg-brand-purple rounded-full animate-bounce"
                  style={{ animationDelay: "0s" }}
                />
                <div
                  className="w-2 h-2 bg-brand-purple rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-2 h-2 bg-brand-purple rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            )}
          </div>
        )}

        {!hasMore && displayedPosts.length > 0 && (
          <div className="text-center py-12 text-text-secondary">
            <span className="text-3xl mb-2 block">🎬</span>
            <p className="text-sm">You've reached the end</p>
          </div>
        )}
      </div>

      {showShareModal && (
        <ShareProfileModal
          username={profile.username}
          userId={userId || loggedInUserId}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default Profile;
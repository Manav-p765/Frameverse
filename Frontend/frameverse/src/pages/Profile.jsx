import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/post.service";
import ProfileHeader from "../components/ProfileHeader";
import ProfilePosts from "../components/ProfilePosts";
import ShareProfileModal from "../components/ShareProfileModal";
import SkeletonLoader from "../components/SkeletonLoader";

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [posts, setPosts] = useState([]);
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  const observerRef = useRef();
  const loadMoreRef = useRef(null);
  
  const POSTS_PER_PAGE = 9;
  const isOwnProfile = !userId;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const endpoint = userId ? `/user/profile/${userId}` : "/user/profile";
        const res = await api.get(endpoint);
        
        setProfile(res.data);
        
        const sortedPosts = [...(res.data.posts || [])].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setPosts(sortedPosts);
        
        if (!isOwnProfile) {
          const currentUser = await api.get("/user/profile");
          setIsFollowing(currentUser.data.following?.includes(userId) || false);
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

    fetchProfile();
  }, [userId, isOwnProfile]);

  useEffect(() => {
    if (!posts.length) return;
    
    const endIndex = currentPage * POSTS_PER_PAGE;
    const newDisplayedPosts = posts.slice(0, endIndex);
    
    setDisplayedPosts(newDisplayedPosts);
    setHasMore(endIndex < posts.length);
  }, [posts, currentPage]);

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
      
      if (updateData.avatarFile) {
        formData.append("avatar", updateData.avatarFile);
      }

      const response = await api.put("/user/updateProfile", formData);

      setProfile({ ...response.data.user });

      console.log("Profile updated successfully!");
      console.log("Updated profile:", response.data.user);
    } catch (error) {
      console.error("Update profile error:", error);
      throw new Error(error.response?.data?.message || "Failed to update profile");
    }
  };

  const handleFollowToggle = async () => {
    if (followLoading) return;
    
    setFollowLoading(true);
    const previousState = isFollowing;
    
    setIsFollowing(!isFollowing);
    setProfile({
      ...profile,
      followers: isFollowing
        ? profile.followers.filter((id) => id !== userId)
        : [...profile.followers, userId],
    });

    try {
      if (isFollowing) {
        await api.post(`/user/unfollow/${userId}`);
      } else {
        await api.post(`/user/follow/${userId}`);
      }
    } catch (err) {
      setIsFollowing(previousState);
      setProfile({
        ...profile,
        followers: previousState
          ? [...profile.followers, userId]
          : profile.followers.filter((id) => id !== userId),
      });
      console.error("Failed to toggle follow:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
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

  const handlePostClick = (post) => {
    navigate(`/post/${post._id}`);
  };

  const handleUserClick = (user) => {
    navigate(`/profile/${user._id}`);
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#18181c] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold text-white mb-2">{error}</h2>
          <p className="text-gray-400 mb-6">This user may not exist or has been removed</p>
          <button 
            onClick={() => navigate("/feed")} 
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            ← Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#18181c] text-white">
      {/* Content */}
      <div className="max-w-4xl mx-auto">
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          followLoading={followLoading}
          onFollowToggle={handleFollowToggle}
          onShareClick={() => setShowShareModal(true)}
          onUpdateProfile={handleUpdateProfile}
          onUserClick={handleUserClick}
        />

        {/* Posts Grid */}
        <div className="px-4">
          <ProfilePosts
            posts={displayedPosts}
            isOwnProfile={isOwnProfile}
            onDeletePost={handleDeletePost}
            profile={profile}
            onPostClick={handlePostClick}
          />
        </div>

        {/* Load More Trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {loadingMore && (
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            )}
          </div>
        )}

        {/* End Message */}
        {!hasMore && displayedPosts.length > 0 && (
          <div className="text-center py-12 text-gray-500">
            <span className="text-3xl mb-2 block">🎬</span>
            <p className="text-sm">You've reached the end</p>
          </div>
        )}
      </div>

      {/* Share Profile Modal */}
      {showShareModal && (
        <ShareProfileModal
          username={profile.username}
          userId={userId || "me"}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default Profile;
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/post.service";
import ProfileHeader from "../components/ProfileHeader";
import ProfilePosts from "../components/ProfilePosts";
import ProfilePictureModal from "../components/ProfilePictureModel";
import ShareProfileModal from "../components/ShareProfileModal";
import SkeletonLoader from "../components/SkeletonLoader";
import "../styles/Profile.css";

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [activeFilter, setActiveFilter] = useState("all");
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState("");
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
        setBioValue(res.data.bio || "");
        
        const sortedPosts = [...(res.data.posts || [])].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setPosts(sortedPosts);
        setFilteredPosts(sortedPosts);
        
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
    if (!filteredPosts.length) return;
    
    const endIndex = currentPage * POSTS_PER_PAGE;
    const newDisplayedPosts = filteredPosts.slice(0, endIndex);
    
    setDisplayedPosts(newDisplayedPosts);
    setHasMore(endIndex < filteredPosts.length);
  }, [filteredPosts, currentPage]);

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

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
    
    if (filter === "all") {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(
        (post) => post.category?.toLowerCase() === filter.toLowerCase()
      );
      setFilteredPosts(filtered);
    }
  };

  const handleBioSave = async () => {
    try {
      await api.put("/user/updateProfile", { bio: bioValue });
      setProfile({ ...profile, bio: bioValue });
      setIsEditingBio(false);
    } catch (err) {
      console.error("Failed to update bio:", err);
      alert("Failed to update bio");
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
    setFilteredPosts(updatedPosts.filter((p) => 
      activeFilter === "all" || p.category?.toLowerCase() === activeFilter.toLowerCase()
    ));

    try {
      await api.delete(`/post/${postId}`);
    } catch (err) {
      setPosts(previousPosts);
      setFilteredPosts(previousPosts);
      console.error("Failed to delete post:", err);
      alert("Failed to delete post");
    }
  };

  const handleAvatarUpdate = (newAvatarUrl) => {
    setProfile({
      ...profile,
      avatar: [{ url: newAvatarUrl }],
    });
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="profile-error">
        <div className="error-content">
          <div className="error-icon">🎬</div>
          <h2>{error}</h2>
          <p>This user may not exist or has been removed</p>
          <button onClick={() => navigate("/feed")} className="back-btn">
            ← Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-bg">
        <div className="bg-gradient"></div>
        <div className="bg-grain"></div>
      </div>

      <div className="profile-container">
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          followLoading={followLoading}
          onFollowToggle={handleFollowToggle}
          onAvatarClick={() => setShowAvatarModal(true)}
          onShareClick={() => setShowShareModal(true)}
          bioValue={bioValue}
          isEditingBio={isEditingBio}
          onBioChange={setBioValue}
          onBioEdit={() => setIsEditingBio(true)}
          onBioSave={handleBioSave}
          onBioCancel={() => {
            setIsEditingBio(false);
            setBioValue(profile.bio || "");
          }}
        />

        <div className="filter-bar">
          <button
            className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => handleFilterChange("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${activeFilter === "movie" ? "active" : ""}`}
            onClick={() => handleFilterChange("movie")}
          >
            🎬 Movies
          </button>
          <button
            className={`filter-btn ${activeFilter === "anime" ? "active" : ""}`}
            onClick={() => handleFilterChange("anime")}
          >
            🎌 Anime
          </button>
        </div>

        <ProfilePosts
          posts={displayedPosts}
          isOwnProfile={isOwnProfile}
          onDeletePost={handleDeletePost}
          profile={profile}
        />

        {hasMore && (
          <div ref={loadMoreRef} className="load-more-trigger">
            {loadingMore && (
              <div className="loading-more">
                <div className="loader-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>
        )}

        {!hasMore && displayedPosts.length > 0 && (
          <div className="end-message">
            <span>🎬</span>
            <p>You've reached the end</p>
          </div>
        )}
      </div>

      {showAvatarModal && (
        <ProfilePictureModal
          currentAvatar={profile.avatar?.[0]?.url}
          onClose={() => setShowAvatarModal(false)}
          onUpdate={handleAvatarUpdate}
        />
      )}

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
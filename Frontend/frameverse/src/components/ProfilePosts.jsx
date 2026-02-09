import React, { useState } from "react";
import PostCard from "./Postcard";

const ProfilePosts = ({ posts, isOwnProfile, onDeletePost, profile }) => {
  const [deletingPostId, setDeletingPostId] = useState(null);

  const handleDelete = async (postId) => {
    setDeletingPostId(postId);
    await onDeletePost(postId);
    setDeletingPostId(null);
  };

  if (posts.length === 0) {
    return (
      <div className="empty-posts">
        <div className="empty-content">
          <div className="empty-icon">📽️</div>
          <h3>No posts yet</h3>
          <p>
            {isOwnProfile
              ? "Start sharing your favorite movie & anime moments!"
              : "This user hasn't posted anything yet"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="posts-grid">
      {posts.map((post) => (
        <div key={post._id} className="post-wrapper">
          <PostCard post={post} profile={profile} />
          {isOwnProfile && (
            <button
              className="delete-post-btn"
              onClick={() => handleDelete(post._id)}
              disabled={deletingPostId === post._id}
              title="Delete post"
            >
              {deletingPostId === post._id ? (
                <span className="delete-loader"></span>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProfilePosts;
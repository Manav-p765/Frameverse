import React, { useState } from "react";

const ProfilePosts = ({ posts, isOwnProfile, onDeletePost, profile, onPostClick }) => {
  const [imageErrors, setImageErrors] = useState({});
  const [selectedPost, setSelectedPost] = useState(null);

  const handleImageError = (postId) => {
    setImageErrors(prev => ({ ...prev, [postId]: true }));
  };


  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-gray-400">
        <div className="text-6xl mb-4">📽️</div>
        <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
        <p className="text-gray-500 text-center max-w-sm">
          {isOwnProfile
            ? "Start sharing your favorite movie & anime moments!"
            : "This user hasn't posted anything yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 w-full">
      {posts.map((post) => (
        <div 
          key={post._id} 
          className="relative w-full group cursor-pointer"
          onClick={() => onPostClick(post)}
        >
          {/* Post Image */}
          <div className="relative w-full aspect-square overflow-hidden bg-gray-900">
            {imageErrors[post._id] ? (
              // Fallback UI when image fails to load
              <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-gray-800 to-gray-900">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-gray-600 mb-2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <p className="text-gray-500 text-xs text-center px-2">Image not available</p>
              </div>
            ) : (
              <img
                src={post.images?.[0] || post.image?.url}
                alt="Post"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={() => handleImageError(post._id)}
              />
            )}

            {/* Multiple Images Indicator */}
            {post.images && post.images.length > 1 && !imageErrors[post._id] && (
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-md p-1">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-white"
                >
                  <rect x="8" y="8" width="12" height="12" rx="2" />
                  <path d="M4 16V4h12" />
                </svg>
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProfilePosts;
import React, { useState, useEffect } from "react";
import FollowList from "./FollowList";
import UpdateProfileModal from "./UpdateProfileModal";

const ProfileHeader = ({
  profile,
  isOwnProfile,
  isFollowing,
  followLoading,
  onFollowToggle,
  onShareClick,
  onUpdateProfile,
  onUserClick,
}) => {
  const { username, avatar, posts, followers, following, bio, profilePic } = profile;

  const [showFollowersList, setShowFollowersList] = useState(false);
  const [showFollowingList, setShowFollowingList] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const postCount = posts?.length || 0;
  const followerCount = followers?.length || 0;
  const followingCount = following?.length || 0;

  const handleUpdateProfile = async (updateData) => {
    await onUpdateProfile(updateData);
  };

  useEffect(() => {
  const handleEsc = (e) => {
    if (e.key === "Escape") {
      setShowImagePreview(false);
    }
  };
  window.addEventListener("keydown", handleEsc);
  return () => window.removeEventListener("keydown", handleEsc);
}, []);



  return (
    <>
      <div className="w-full px-6 py-10 border-b border-gray-800">
        <div className="flex gap-8">
          {/* profile pic */}
          <div className="shrink-0">
            <div className="relative">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt={`${username}'s profilePic`}
                  onClick={() => setShowImagePreview(true)}
                  className="w-28 h-28 md:w-40 md:h-40 rounded-full object-cover [image-rendering:auto]"
                />
              ) : (
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl md:text-4xl">
                    {username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* {image preview} */}
          {showImagePreview && (
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={() => setShowImagePreview(false)}
            >
              <div
                className="relative w-[90%] md:w-[60%] max-h-[80vh] animate-[zoomIn_0.2s_ease-out]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowImagePreview(false)}
                  className="absolute -top-10 right-0 text-white text-2xl hover:opacity-70"
                >
                  ✕
                </button>

                <img
                  src={profilePic}
                  alt="Profile preview"
                  className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                />
              </div>
            </div>
          )}


          {/* User Info */}
          <div className="flex-1 min-w-0">
            {/* Username */}
            <h1 className="text-xl md:text-2xl font-semibold text-white mb-4 truncate">
              {username}
            </h1>

            {/* Stats */}
            <div className="flex gap-10 mb-6">
              <div>
                <span className="font-semibold text-white text-xl mr-1">{postCount}</span>
                <span className="text-gray-400 text-base">posts</span>
              </div>
              <button
                onClick={() => setShowFollowersList(true)}
                className="hover:opacity-80 transition-opacity"
              >
                <span className="font-semibold text-white mr-1">{followerCount}</span>
                <span className="text-gray-400 text-sm">followers</span>
              </button>
              <button
                onClick={() => setShowFollowingList(true)}
                className="hover:opacity-80 transition-opacity"
              >
                <span className="font-semibold text-white mr-1">{followingCount}</span>
                <span className="text-gray-400 text-sm">following</span>
              </button>
            </div>

            {/* Bio */}
            {bio && (
              <p className="text-base md:text-lg text-gray-300 mb-4 leading-relaxed">
                {bio}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => setShowUpdateModal(true)}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded border border-gray-700 transition-colors"
                  >
                    Edit profile
                  </button>
                  <button
                    onClick={onShareClick}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded border border-gray-700 transition-colors"
                    title="Share profile"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="inline"
                    >
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                </>
              ) : (
                <button
                  onClick={onFollowToggle}
                  disabled={followLoading}
                  className={`px-8 py-2 text-sm font-semibold rounded transition-all ${isFollowing
                    ? "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {followLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : isFollowing ? (
                    "Following"
                  ) : (
                    "Follow"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Update Profile Modal */}
      <UpdateProfileModal
        profile={profile}
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSave={handleUpdateProfile}
      />

      {/* Followers List Modal */}
      <FollowList
        type="followers"
        users={followers || []}
        isOpen={showFollowersList}
        onClose={() => setShowFollowersList(false)}
        onUserClick={(user) => {
          setShowFollowersList(false);
          onUserClick && onUserClick(user);
        }}
      />

      {/* Following List Modal */}
      <FollowList
        type="following"
        users={following || []}
        isOpen={showFollowingList}
        onClose={() => setShowFollowingList(false)}
        onUserClick={(user) => {
          setShowFollowingList(false);
          onUserClick && onUserClick(user);
        }}
      />
    </>
  );
};


<style>{`
  @keyframes zoomIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`}</style>


export default ProfileHeader;
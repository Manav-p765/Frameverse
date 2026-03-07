import React, { useState, useEffect } from "react";
import FollowList from "./FollowList";
import { useNavigate } from "react-router-dom";
import { chatAPI } from "../../services/api";
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
  const [chatLoading, setChatLoading] = useState(false);
  const navigate = useNavigate();

  const postCount = posts?.length || 0;
  const followerCountDisplay = followers?.length ?? 0;
  const followingCountDisplay = following?.length ?? 0;

  const handleUpdateProfile = async (updateData) => {
    await onUpdateProfile(updateData);
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setShowImagePreview(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);


  const handleMessageClick = async () => {
    setChatLoading(true);
    try {
      const chat = await chatAPI.createChat(profile._id);
      navigate(`/chats/${chat._id}`);
    } catch {
      // silently fail
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      <div className="w-full px-4 sm:px-6 py-8 border-b border-border-color">

        {/* ── Mobile layout: avatar row + info stacked ── */}
        <div className="flex flex-col sm:flex-row sm:gap-10">

          {/* Top row on mobile: avatar + action buttons side by side */}
          <div className="flex items-start gap-5 sm:gap-0 sm:flex-col sm:items-center">
            {/* Avatar */}
            <div className="shrink-0">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt={`${username}'s profile`}
                  onClick={() => setShowImagePreview(true)}
                  className="w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full object-cover cursor-pointer ring-2 ring-transparent hover:ring-brand-purple/50 transition-all shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-linear-to-br from-brand-purple to-brand-pink flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl sm:text-4xl">
                    {username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons — shown inline with avatar on mobile only */}
            <div className="flex sm:hidden items-center gap-2 mt-2 flex-wrap">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => setShowUpdateModal(true)}
                    className="px-4 py-1.5 bg-bg-secondary hover:bg-bg-tertiary dark:hover:bg-gray-700 text-text-primary text-xs font-medium rounded border border-border-color transition-colors"
                  >
                    Edit profile
                  </button>
                  <button
                    onClick={onShareClick}
                    className="p-1.5 bg-bg-secondary hover:bg-bg-tertiary dark:hover:bg-gray-700 text-text-primary rounded border border-border-color transition-colors"
                    title="Share profile"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onFollowToggle}
                    disabled={followLoading}
                    className={`px-6 py-1.5 text-xs font-semibold rounded transition-all ${isFollowing
                      ? "bg-bg-secondary hover:bg-bg-tertiary dark:hover:bg-gray-700 text-text-primary border border-border-color"
                      : "bg-brand-purple hover:opacity-90 text-text-primary"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {followLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : isFollowing ? "Following" : "Follow"}
                  </button>

                  {isFollowing && (
                    <button
                      onClick={handleMessageClick}
                      disabled={chatLoading}
                      className="p-1.5 bg-bg-secondary hover:bg-bg-tertiary dark:hover:bg-gray-700 text-text-primary rounded border border-border-color transition-colors disabled:opacity-50"
                      title="Send message"
                    >
                      {chatLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      )}
                    </button>
                  )}
                </>
              )}

            </div>
          </div>

          {/* Info section */}
          <div className="flex-1 min-w-0 mt-4 sm:mt-0">

            {/* Username row */}
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-brand-orange to-brand-pink mb-3 truncate">
              {username}
            </h1>

            {/* Stats — scrollable row on mobile to avoid overflow */}
            <div className="flex gap-6 sm:gap-10 mb-4 overflow-x-auto no-scrollbar pb-1">
              <div className="shrink-0 text-center sm:text-left">
                <span className="font-semibold text-text-primary text-base sm:text-xl mr-1">{postCount}</span>
                <span className="text-text-secondary text-sm">posts</span>
              </div>
              <button
                onClick={() => setShowFollowersList(true)}
                className="shrink-0 hover:opacity-80 transition-opacity text-center sm:text-left"
              >
                <span className="font-semibold text-text-primary text-base sm:text-xl mr-1">{followerCountDisplay}</span>
                <span className="text-text-secondary text-sm">followers</span>
              </button>
              <button
                onClick={() => setShowFollowingList(true)}
                className="shrink-0 hover:opacity-80 transition-opacity text-center sm:text-left"
              >
                <span className="font-semibold text-text-primary text-base sm:text-xl mr-1">{followingCountDisplay}</span>
                <span className="text-text-secondary text-sm">following</span>
              </button>
            </div>

            {/* Bio */}
            {bio && (
              <p className="text-sm sm:text-base text-text-secondary mb-4 leading-relaxed wrap-break-word">
                {bio}
              </p>
            )}

            {/* Action buttons — desktop only (hidden on mobile, shown above avatar there) */}
            <div className="hidden sm:flex gap-2">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => setShowUpdateModal(true)}
                    className="px-6 py-2 bg-bg-secondary hover:bg-bg-tertiary dark:hover:bg-gray-700 text-text-primary text-sm font-medium rounded border border-border-color transition-colors"
                  >
                    Edit profile
                  </button>
                  <button
                    onClick={onShareClick}
                    className="px-3 py-2 bg-bg-secondary hover:bg-bg-tertiary dark:hover:bg-gray-700 text-text-primary rounded border border-border-color transition-colors"
                    title="Share profile"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onFollowToggle}
                    disabled={followLoading}
                    className={`px-8 py-2 text-sm font-semibold rounded transition-all ${isFollowing
                      ? "bg-bg-secondary hover:bg-bg-tertiary dark:hover:bg-gray-700 text-text-primary border border-border-color"
                      : "bg-brand-purple hover:opacity-90 text-text-primary"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {followLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : isFollowing ? "Following" : "Follow"}
                  </button>

                  {isFollowing && (
                    <button
                      onClick={handleMessageClick}
                      disabled={chatLoading}
                      className="px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary dark:hover:bg-gray-700 text-text-primary text-sm font-medium rounded border border-border-color transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {chatLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          Message
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div
          className="fixed inset-0 bg-bg-primary/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowImagePreview(false)}
        >
          <div
            className="relative w-full max-w-sm sm:max-w-lg md:max-w-2xl animate-[zoomIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute -top-9 right-0 text-text-primary text-2xl hover:opacity-70 transition-opacity"
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

      {/* Modals */}
      <UpdateProfileModal
        profile={profile}
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSave={handleUpdateProfile}
      />
      <FollowList
        type="followers"
        users={followers || []}
        isOpen={showFollowersList}
        onClose={() => setShowFollowersList(false)}
        onUserClick={(user) => { setShowFollowersList(false); onUserClick?.(user); }}
      />
      <FollowList
        type="following"
        users={following || []}
        isOpen={showFollowingList}
        onClose={() => setShowFollowingList(false)}
        onUserClick={(user) => { setShowFollowingList(false); onUserClick?.(user); }}
      />

      <style>{`
        @keyframes zoomIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};

export default ProfileHeader;
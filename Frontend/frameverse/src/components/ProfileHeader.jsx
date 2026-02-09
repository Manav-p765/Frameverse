import React from "react";

const ProfileHeader = ({
  profile,
  isOwnProfile,
  isFollowing,
  followLoading,
  onFollowToggle,
  onAvatarClick,
  onShareClick,
  bioValue,
  isEditingBio,
  onBioChange,
  onBioEdit,
  onBioSave,
  onBioCancel,
}) => {
  const { username, avatar, posts, followers, following } = profile;

  const postCount = posts?.length || 0;
  const followerCount = followers?.length || 0;
  const followingCount = following?.length || 0;

  return (
    <div className="profile-header">
      <div className="header-content">
        {/* Avatar */}
        <div 
          className="avatar-wrapper" 
          onClick={isOwnProfile ? onAvatarClick : null}
          style={{ cursor: isOwnProfile ? "pointer" : "default" }}
        >
          {avatar && avatar.length > 0 ? (
            <img
              src={avatar[0].url}
              alt={`${username}'s avatar`}
              className="avatar-image"
            />
          ) : (
            <div className="avatar-placeholder">
              <span className="avatar-initial">
                {username?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {isOwnProfile && (
            <div className="avatar-overlay">
              <span>Change</span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="user-info">
          <div className="username-row">
            <h1 className="username">{username}</h1>
            
            <div className="action-buttons">
              {isOwnProfile ? (
                <>
                  <button className="icon-btn" onClick={onShareClick} title="Share profile">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3"/>
                      <circle cx="6" cy="12" r="3"/>
                      <circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                  </button>
                </>
              ) : (
                <button
                  className={`follow-btn ${isFollowing ? "following" : ""}`}
                  onClick={onFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <span className="btn-loader"></span>
                  ) : isFollowing ? (
                    "Following"
                  ) : (
                    "Follow"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat">
              <span className="stat-number">{postCount}</span>
              <span className="stat-label">posts</span>
            </div>
            <div className="stat">
              <span className="stat-number">{followerCount}</span>
              <span className="stat-label">followers</span>
            </div>
            <div className="stat">
              <span className="stat-number">{followingCount}</span>
              <span className="stat-label">following</span>
            </div>
          </div>

          {/* Bio */}
          <div className="bio-section">
            {isEditingBio ? (
              <div className="bio-edit">
                <textarea
                  value={bioValue}
                  onChange={(e) => onBioChange(e.target.value)}
                  maxLength={160}
                  placeholder="Share your passion for movies & anime..."
                  className="bio-textarea"
                  autoFocus
                />
                <div className="bio-actions">
                  <button onClick={onBioSave} className="save-btn">
                    Save
                  </button>
                  <button onClick={onBioCancel} className="cancel-btn">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bio-display">
                <p className={bioValue ? "bio-text" : "bio-placeholder"}>
                  {bioValue || (isOwnProfile
                    ? "Add a bio to tell others about your favorite movies & anime"
                    : "No bio yet")}
                </p>
                
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
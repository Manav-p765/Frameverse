/**
 * PostCard Component
 *
 * Renders a single social media post with image, engagement buttons (like,
 * comment, share), author info, and action menu (edit/delete/report).
 *
 * Key behaviors:
 *   - Real-time metric updates via socket events (postLiked, postCommented, postShared)
 *   - Double-tap/double-click to like (Instagram-style with heart animation)
 *   - Web Share API with clipboard fallback for sharing
 *   - Mobile-responsive comment panel
 *
 * Props: post, onLikeToggle, onUserClick, onImageClick, onDeletePost,
 *        onReportPost, onPostUpdate, onCommentClick, onCommentAdded,
 *        onCommentDeleted, currentUser, onClose, style
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Share2, Heart, MessageCircle, MoreHorizontal, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSocketEvent } from "../../hooks/useSocket";
import EditPostModal from "./EditPostModal";
import CommentPanel from "../comments/CommentPanel";

const PostCard = ({
  post,
  onLikeToggle,
  onUserClick,
  onImageClick,
  onDeletePost,
  onReportPost,
  onPostUpdate,
  onCommentClick,
  onCommentAdded,
  onCommentDeleted,
  currentUser,
  onClose,
  style,
}) => {
  if (!post) return null;

  // Extract post data
  const {
    _id,
    owner,
    image,
    description,
    location,
    likeCount = 0,
    commentCount = 0,
    sharesCount = 0,
    createdAt,
  } = post;

  const username = owner?.username || 'Unknown';
  const profilePic = owner?.profilePic;
  const userId = owner?._id;

  const isEditable = currentUser?._id && String(userId) === String(currentUser._id);

  // State
  const [showMenu, setShowMenu] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMobileComments, setShowMobileComments] = useState(false);



  // Local copies of metrics — allows optimistic UI updates without waiting
  // for the parent to re-render the whole feed. Socket events update these too.
  const [localLikesCount, setLocalLikesCount] = useState(post.likeCount || 0);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.commentCount || 0);
  const [localSharesCount, setLocalSharesCount] = useState(post.sharesCount || 0);
  const [localLikedByCurrentUser, setLocalLikedByCurrentUser] = useState(post.likedByCurrentUser || false);

  // Sync state if post prop changes
  useEffect(() => {
    setLocalLikesCount(post.likeCount || 0);
    setLocalCommentsCount(post.commentCount || 0);
    setLocalSharesCount(post.sharesCount || 0);
    setLocalLikedByCurrentUser(post.likedByCurrentUser || false);
  }, [post.likeCount, post.commentCount, post.sharesCount, post.likedByCurrentUser]);

  // ─── Real-time socket listeners ──────────────────────────────────────────
  // Each PostCard independently listens for metric updates for its own postId.
  // This means likes/comments/shares from OTHER users update in real-time.
  useSocketEvent("postLiked", (data) => {
    if (data.postId === _id) setLocalLikesCount(data.likeCount);
  });

  useSocketEvent("postCommented", (data) => {
    if (data.postId === _id) setLocalCommentsCount(data.commentCount);
  });

  useSocketEvent("postShared", (data) => {
    if (data.postId === _id) setLocalSharesCount(data.sharesCount);
  });


  // Refs
  const lastTapTime = useRef(0);
  const menuRef = useRef(null);

  // Instagram-style double-tap to like: tracks time between taps.
  // Only triggers if < 300ms gap AND post isn't already liked.
  const handleDoubleTap = useCallback((e) => {
    e.preventDefault();
    const now = Date.now();
    const timeDiff = now - lastTapTime.current;

    if (timeDiff < 300 && timeDiff > 0) {
      if (!localLikedByCurrentUser) {
        onLikeToggle(_id, localLikedByCurrentUser);
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1000);
      }
    }

    lastTapTime.current = now;
  }, [_id, localLikedByCurrentUser, onLikeToggle]);

  // Handle like button click
  const handleLikeClick = useCallback((e) => {
    e.stopPropagation();
    if (onLikeToggle) {
      onLikeToggle(_id, localLikedByCurrentUser);
    }

    if (!localLikedByCurrentUser) {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
  }, [_id, localLikedByCurrentUser, onLikeToggle]);

  // Uses Web Share API (native share sheet on mobile), falls back to clipboard copy
  const handleShare = useCallback(async (e) => {
    e.stopPropagation();

    const shareData = {
      title: `${username}'s post`,
      text: description || 'Check out this post!',
      url: `${window.location.origin}/post/${_id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData); // Native share sheet
      } else {
        await navigator.clipboard.writeText(shareData.url); // Fallback
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  }, [_id, username, description]);

  const navigate = useNavigate();

  // Handle menu actions
  const handleMenuAction = useCallback((action) => {
    setShowMenu(false);

    switch (action) {
      case 'delete':
        if (onDeletePost) {
          onDeletePost(_id);
        }
        break;
      case 'report':
        onReportPost(_id);
        break;
      default:
        break;
    }
  }, [_id, onDeletePost, onReportPost]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const mainImage = image;

  return (
    <article
      className="relative bg-linear-to-br from-bg-bg-primary to-bg-bg-primary dark:from-bg-primary dark:to-bg-primary backdrop-blur-xl overflow-hidden border border-border-color/40 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col lg:flex-row items-stretch rounded-3xl"
      style={style}
    >
      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 z-60 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all shadow-lg border border-white/10"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      )}
      {/* Left Side: Post Content */}
      <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-border-color/20">
        {/* Image Section */}
        <div className="p-5 pb-0">
          <div
            className="relative w-full bg-bg-primary/50 cursor-pointer group overflow-hidden rounded-2xl"
            onClick={() => onImageClick && onImageClick(post, 0)}
            onDoubleClick={handleDoubleTap}
          >
            {!imageLoaded && mainImage && (
              <div className="absolute inset-0 bg-linear-to-br from-gray-800/30 to-gray-900/30 animate-pulse" />
            )}

            {mainImage ? (
              <>
                <img
                  src={mainImage.url}
                  alt="Post"
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  className={`w-full max-h-[65vh] object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                    } `}
                />

                {/* Multiple images indicator */}
                {/* {image.length > 1 && (
                <div className="absolute top-3 right-3 bg-bg-primary/70 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5">
                  <div className="flex gap-1">
                    {images.slice(0, 3).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-white' : 'bg-white/40'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-text-primary text-xs font-medium">+{image.length - 1}</span>
                </div>
              )} */}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-600 text-sm">No image</span>
              </div>
            )}

            {/* Heart animation overlay */}
            {showHeartAnimation && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Heart
                  className="text-text-primary fill-white animate-heart-burst"
                  size={80}
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.8))',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="px-5 py-5 flex-1 flex flex-col justify-between">
          {/* Category/Location tag (if exists) */}
          {location && (
            <div className="mb-3">
              <span className="inline-block px-3 py-1 bg-bg-secondary/50 rounded-full text-text-secondary text-xs font-medium">
                {location}
              </span>
            </div>
          )}

          {/* Title/Description (if exists) */}
          {description && (
            <h3 className="text-text-primary text-md leading-relaxed mb-4 line-clamp-3">
              {description}
            </h3>
          )}

          {/* Metadata section */}
          <div className="flex items-center justify-between pt-3 border-t border-border-color/30">
            {/* User info */}
            <div
              className="flex items-center gap-2.5 cursor-pointer group flex-1"
              onClick={() => onUserClick && onUserClick(userId)}
            >
              {profilePic ? (
                <img
                  src={profilePic}
                  alt={username}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-800/50 group-hover:ring-gray-700 transition-all"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-brand-purple to-brand-pink flex items-center justify-center ring-2 ring-gray-800/50 group-hover:ring-brand-purple/50 transition-all">
                  <span className="text-text-primary font-bold text-xs">
                    {username[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-text-primary text-base font-bold group-hover:text-brand-purple transition-colors truncate">
                  {username}
                </span>
                {createdAt && (
                  <span className="text-text-secondary text-sm">
                    {formatTime(createdAt)}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Like button */}
              <button
                onClick={handleLikeClick}
                className="group transition-transform active:scale-90 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-bg-secondary/30"
              >
                <Heart
                  fill={localLikedByCurrentUser ? "#ef4444" : "none"}
                  className={`w-5 h-5 transition-all ${localLikedByCurrentUser
                    ? 'text-[#ef4444]'
                    : 'text-text-secondary group-hover:text-brand-pink'
                    }`}
                />
                <span className="text-text-secondary text-xs font-semibold tabular-nums">
                  {localLikesCount}
                </span>
              </button>

              {/* Comment button */}
              <button
                className="group transition-transform active:scale-90 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-bg-secondary/30"
                onClick={(e) => {
                  e.stopPropagation();
                  // For mobile/tablet (<1024px), show overlay
                  if (window.innerWidth < 1024) {
                    setShowMobileComments(true);
                  }
                }}
              >
                <MessageCircle className="w-5 h-5 text-text-secondary group-hover:text-brand-purple transition-colors" />
                <span className="text-text-secondary text-xs font-semibold tabular-nums">
                  {localCommentsCount}
                </span>
              </button>

              {/* Share button */}
              <button
                onClick={handleShare}
                className="group transition-transform active:scale-90 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-bg-secondary/30"
              >
                <Share2 className="w-5 h-5 text-text-secondary group-hover:text-brand-orange transition-colors" />
                {localSharesCount > 0 && (
                  <span className="text-text-secondary text-xs font-semibold tabular-nums">
                    {localSharesCount}
                  </span>
                )}
              </button>

              {/* Arrow/More button */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu((prev) => !prev);
                  }}
                  className="p-1.5 hover:bg-bg-secondary/50 rounded-lg transition-colors"
                  aria-label="Post options"
                >
                  <MoreHorizontal className="w-5 h-5 text-text-secondary hover:text-text-secondary transition-colors" />
                </button>

                {showMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-bg-primary/95 backdrop-blur-xl rounded-xl shadow-2xl border border-border-color py-1.5 min-w-40 z-50">
                    <button
                      onClick={handleShare}
                      className="w-full px-4 py-2.5 text-left text-text-secondary text-sm hover:bg-bg-secondary/50 transition-colors"
                    >
                      Share post

                    </button>
                    {isEditable ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEditModal(true);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-text-primary text-sm hover:bg-bg-secondary/50 transition-colors"
                        >
                          Edit post
                        </button>
                        <button
                          onClick={() => onDeletePost(_id)}
                          className="w-full px-4 py-2.5 text-left text-brand-pink text-sm hover:bg-bg-secondary/50 transition-colors"
                        >
                          Delete post
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleMenuAction("report")}
                          className="w-full px-4 py-2.5 text-left text-brand-pink text-sm hover:bg-bg-secondary/50 transition-colors"
                        >
                          Report post
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal for editing */}
      {/* Right Side: Comments Section (Desktop only) */}
      <div className="hidden lg:block w-[320px] shrink-0 bg-bg-primary/5 flex flex-col">
        <div className="p-4 border-b border-border-color/20 bg-bg-primary/50 backdrop-blur-md sticky top-0 z-10">
          <h3 className="text-lg font-bold text-text-primary px-1">Comments</h3>
        </div>
        <div className="flex-1 overflow-hidden">
          <CommentPanel
            postId={_id}
            currentUser={currentUser}
            onCommentAdded={() => onCommentAdded && onCommentAdded(_id)}
            onCommentDeleted={() => onCommentDeleted && onCommentDeleted(_id)}
          />
        </div>
      </div>

      {/* Mobile Comment Overlay */}
      {showMobileComments && (
        <div className="fixed inset-0 z-[100] bg-bg-primary flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between p-4 border-b border-border-color/30 bg-bg-primary/80 backdrop-blur-md sticky top-0 z-10">
            <h2 className="text-xl font-bold text-text-primary px-2">Comments</h2>
            <button
              onClick={() => setShowMobileComments(false)}
              className="p-2 hover:bg-bg-secondary/50 rounded-full transition-colors text-text-primary"
            >
              <X className="w-6 h-6" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <CommentPanel
              postId={_id}
              currentUser={currentUser}
              onCommentAdded={() => onCommentAdded && onCommentAdded(_id)}
              onCommentDeleted={() => onCommentDeleted && onCommentDeleted(_id)}
            />
          </div>
        </div>
      )}

      <EditPostModal
        post={post}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={(updatedPost) => {
          if (onPostUpdate) onPostUpdate(updatedPost);
        }}
      />

      {/* Animations */}
      <style>{`
        @keyframes heart-burst {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          15% {
            opacity: 1;
            transform: scale(1.2);
          }
          30% {
            transform: scale(0.95);
          }
          45% {
            transform: scale(1.1);
          }
          80% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1);
          }
        }

        .animate-heart-burst {
          animation: heart-burst 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </article>
  );
};
export default PostCard;

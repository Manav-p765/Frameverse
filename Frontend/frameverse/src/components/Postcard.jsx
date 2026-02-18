import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, MessageCircle, ArrowRight } from "lucide-react";

const PostCard = ({
  post,
  onLikeToggle,
  onUserClick,
  onImageClick,
  onDeletePost,
  onReportPost,
  style,
}) => {
  if (!post) return null;

  // State
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);


  // Refs
  const lastTapTime = useRef(0);
  const menuRef = useRef(null);


  // Extract post data
  const {
    _id,
    owner,
    image,
    description,
    location,
    likes = [],
    commentsCount = 0,
    editable = false,
    createdAt,
  } = post;



  const username = owner?.username || 'Unknown';
  const profilePic = owner?.profilePic;
  const userId = owner?._id;;
  const { likesCount = 0, likedByCurrentUser = false } = post;

  // Handle double-tap/double-click like
  const handleDoubleTap = useCallback((e) => {
    e.preventDefault();

    const now = Date.now();
    const timeDiff = now - lastTapTime.current;

    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap/click detected
      if (!likedByCurrentUser) {
        onLikeToggle(_id, likedByCurrentUser);
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1000);
      }
    }

    lastTapTime.current = now;
  }, [_id, likedByCurrentUser, onLikeToggle]);

  // Handle like button click
  const handleLikeClick = useCallback((e) => {
    e.stopPropagation();
    onLikeToggle(_id, likedByCurrentUser);

    if (!likedByCurrentUser) {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
  }, [_id, likedByCurrentUser, onLikeToggle]);

  // Handle share
  const handleShare = useCallback(async (e) => {
    e.stopPropagation();

    const shareData = {
      title: `${username}'s post`,
      text: description || 'Check out this post!',
      url: `${window.location.origin}/post/${_id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  }, [_id, username, description]);

  // Handle menu actions
  const handleMenuAction = useCallback((action) => {
    setShowMenu(false);

    switch (action) {
      case 'edit':
        window.location.href = `/post/${_id}/edit`;
        break;
      case 'delete':
        onDeletePost(_id);
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
      className="bg-linear-to-br from-[#1a1a1f]/80 to-[#16161b]/80 backdrop-blur-xl overflow-hidden border border-gray-800/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-gray-700/60 hover:-translate-y-1"
      style={style}
    >
      {/* Image Section */}
      <div className="p-5 pb-0">
        <div
          className="relative w-full aspect-4/3 bg-gray-900/50 cursor-pointer group overflow-hidden rounded-2xl"
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
                className={`w-full h-full object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                  } `}
              />

              {/* Multiple images indicator */}
              {image.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5">
                  <div className="flex gap-1">
                    {images.slice(0, 3).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-white' : 'bg-white/40'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-white text-xs font-medium">+{image.length - 1}</span>
                </div>
              )}
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
                className="text-white fill-white animate-heart-burst"
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
      <div className="px-5 py-5">
        {/* Category/Location tag (if exists) */}
        {location && (
          <div className="mb-3">
            <span className="inline-block px-3 py-1 bg-gray-800/50 rounded-full text-gray-400 text-xs font-medium">
              {location}
            </span>
          </div>
        )}

        {/* Title/Description (if exists) */}
        {description && (
          <h3 className="text-white text-lg font-semibold leading-snug mb-4 line-clamp-2">
            {description}
          </h3>
        )}

        {/* Metadata section */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-800/30">
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
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-gray-800/50 group-hover:ring-gray-700 transition-all">
                <span className="text-white font-bold text-xs">
                  {username[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors truncate">
                {username}
              </span>
              {createdAt && (
                <span className="text-gray-500 text-xs">
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
              className="group transition-transform active:scale-90 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-800/30"
            >
              <Heart
                className={`w-5 h-5 transition-all ${likedByCurrentUser
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-500 group-hover:text-red-400'
                  }`}
              />
              {likesCount > 0 && (
                <span className="text-gray-400 text-xs font-medium">
                  {likesCount}
                </span>
              )}
            </button>

            {/* Comment button */}
            {commentsCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComments(!showComments);
                }}
                className="group transition-transform active:scale-90 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-800/30"
              >
                <MessageCircle className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                <span className="text-gray-400 text-xs font-medium">
                  {commentsCount}
                </span>
              </button>
            )}

            {/* Arrow/More button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <ArrowRight className="w-5 h-5 text-gray-500 hover:text-gray-300 transition-colors" />
              </button>

              {showMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-800 py-1.5 min-w-40 z-50">
                  {editable ? (
                    <>
                      <button
                        onClick={() => handleMenuAction('edit')}
                        className="w-full px-4 py-2.5 text-left text-gray-300 text-sm hover:bg-gray-800/50 transition-colors"
                      >
                        Edit post
                      </button>
                      <button
                        onClick={() => handleMenuAction('delete')}
                        className="w-full px-4 py-2.5 text-left text-red-400 text-sm hover:bg-gray-800/50 transition-colors"
                      >
                        Delete post
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleShare}
                        className="w-full px-4 py-2.5 text-left text-gray-300 text-sm hover:bg-gray-800/50 transition-colors"
                      >
                        Share post
                      </button>
                      <button
                        onClick={() => handleMenuAction('report')}
                        className="w-full px-4 py-2.5 text-left text-red-400 text-sm hover:bg-gray-800/50 transition-colors"
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

        {/* Comments section (expandable) */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-800/30 space-y-3">
            <div className="text-gray-400 text-sm">
              Comments feature coming soon...
            </div>
          </div>
        )}
      </div>

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

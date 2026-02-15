import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";

const PostLightbox = ({ post, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [swipeStart, setSwipeStart] = useState(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const lightboxRef = useRef(null);

  const images = post?.images || [];
  const totalImages = images.length;

  // Reset image loaded state when index changes
  useEffect(() => {
    setImageLoaded(false);
  }, [currentIndex]);

  // Navigate to previous image
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Navigate to next image
  const handleNext = useCallback(() => {
    if (currentIndex < totalImages - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, totalImages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevious, handleNext, onClose]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Touch/Swipe handlers for mobile
  const handleTouchStart = useCallback((e) => {
    setSwipeStart(e.touches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (swipeStart === null) return;
    
    const currentTouch = e.touches[0].clientX;
    const diff = currentTouch - swipeStart;
    setSwipeDistance(diff);
  }, [swipeStart]);

  const handleTouchEnd = useCallback(() => {
    if (Math.abs(swipeDistance) > 100) {
      if (swipeDistance > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }
    
    setSwipeStart(null);
    setSwipeDistance(0);
  }, [swipeDistance, handlePrevious, handleNext]);

  // Swipe down to close (mobile)
  const handleVerticalSwipe = useCallback((e) => {
    const touch = e.touches[0];
    const startY = touch.clientY;

    const handleMove = (moveEvent) => {
      const currentY = moveEvent.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 150) {
        onClose();
        document.removeEventListener('touchmove', handleMove);
      }
    };

    document.addEventListener('touchmove', handleMove, { passive: true });
    document.addEventListener('touchend', () => {
      document.removeEventListener('touchmove', handleMove);
    }, { once: true });
  }, [onClose]);

  // Download image
  const handleDownload = useCallback(async () => {
    const imageUrl = images[currentIndex]?.url;
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `post-image-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  }, [images, currentIndex]);

  if (!post || images.length === 0) return null;

  return (
    <div
      ref={lightboxRef}
      className="fixed inset-0 z-9999 bg-black/95 backdrop-blur-md"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onTouchStart={handleVerticalSwipe}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all backdrop-blur-sm md:top-6 md:right-6"
        aria-label="Close"
      >
        <X className="w-6 h-6 text-white md:w-7 md:h-7" />
      </button>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="fixed top-4 right-16 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all backdrop-blur-sm md:top-6 md:right-20"
        aria-label="Download"
      >
        <Download className="w-5 h-5 text-white md:w-6 md:h-6" />
      </button>

      {/* Image counter */}
      {totalImages > 1 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-black/50 rounded-full backdrop-blur-sm md:top-6">
          <span className="text-white text-sm font-medium">
            {currentIndex + 1} / {totalImages}
          </span>
        </div>
      )}

      {/* Main content container */}
      <div className="flex items-center justify-center h-full px-4 md:px-0">
        <div className="relative w-full max-w-6xl">
          {/* Desktop: max 60% width, Mobile: 90% width */}
          <div className="relative mx-auto w-full md:w-[60%]">
            {/* Image container */}
            <div
              className="relative flex items-center justify-center"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                transform: `translateX(${swipeDistance}px)`,
                transition: swipeStart === null ? 'transform 0.3s ease' : 'none',
              }}
            >
              {/* Loading skeleton */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-900 animate-pulse rounded-lg" />
              )}

              {/* Main image */}
              <img
                src={images[currentIndex]?.url}
                alt={`Image ${currentIndex + 1}`}
                className={`max-h-[85vh] w-auto max-w-full object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                style={{
                  animation: imageLoaded ? 'zoomIn 0.3s ease-out' : 'none',
                }}
              />
            </div>

            {/* Navigation arrows - Desktop */}
            {totalImages > 1 && (
              <>
                {currentIndex > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all backdrop-blur-sm z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-8 h-8 text-white" />
                  </button>
                )}

                {currentIndex < totalImages - 1 && (
                  <button
                    onClick={handleNext}
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all backdrop-blur-sm z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-8 h-8 text-white" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Post info at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4 md:p-6">
        <div className="max-w-6xl mx-auto md:w-[60%] md:mx-auto">
          <div className="flex items-start gap-3">
            {/* User info */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm mb-1">
                {post.user?.username}
              </p>
              {post.description && (
                <p className="text-gray-300 text-sm line-clamp-2">
                  {post.description}
                </p>
              )}
              {post.location && (
                <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                  <span>📍</span>
                  {post.location}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail navigation - Mobile */}
      {totalImages > 1 && (
        <div className="md:hidden fixed bottom-20 left-0 right-0 px-4">
          <div className="flex gap-2 justify-center overflow-x-auto pb-2 scrollbar-hide">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`shrink-0 w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'bg-white w-6'
                    : 'bg-white/40'
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Swipe indicator - Mobile */}
      {totalImages > 1 && currentIndex < totalImages - 1 && (
        <div className="md:hidden fixed right-4 top-1/2 -translate-y-1/2 opacity-50">
          <ChevronRight className="w-6 h-6 text-white animate-pulse" />
        </div>
      )}

      {totalImages > 1 && currentIndex > 0 && (
        <div className="md:hidden fixed left-4 top-1/2 -translate-y-1/2 opacity-50">
          <ChevronLeft className="w-6 h-6 text-white animate-pulse" />
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default PostLightbox;
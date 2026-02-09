import React from "react";

const SkeletonLoader = () => {
  return (
    <div className="skeleton-loader">
      <div className="skeleton-bg">
        <div className="bg-gradient"></div>
        <div className="bg-grain"></div>
      </div>
      
      <div className="skeleton-container">
        {/* Header Skeleton */}
        <div className="skeleton-header">
          <div className="skeleton-avatar pulse"></div>
          <div className="skeleton-info">
            <div className="skeleton-bar skeleton-username pulse"></div>
            <div className="skeleton-stats">
              <div className="skeleton-bar skeleton-stat pulse"></div>
              <div className="skeleton-bar skeleton-stat pulse"></div>
              <div className="skeleton-bar skeleton-stat pulse"></div>
            </div>
            <div className="skeleton-bar skeleton-bio pulse"></div>
            <div className="skeleton-bar skeleton-bio-short pulse"></div>
          </div>
        </div>

        {/* Filter Skeleton */}
        <div className="skeleton-filters">
          <div className="skeleton-bar skeleton-filter pulse"></div>
          <div className="skeleton-bar skeleton-filter pulse"></div>
          <div className="skeleton-bar skeleton-filter pulse"></div>
        </div>

        {/* Posts Grid Skeleton */}
        <div className="skeleton-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-post pulse" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="skeleton-post-image"></div>
              <div className="skeleton-post-content">
                <div className="skeleton-bar skeleton-post-title"></div>
                <div className="skeleton-bar skeleton-post-desc"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
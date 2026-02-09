import { useState } from "react";
import { Heart } from "lucide-react";

const PostCard = ({ post, profile }) => {
  if (!post) return null;


  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (

    <div className="bg-[#18181c] rounded-2xl overflow-hidden border border-white/5 shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-sm text-white">
          {post.owner.username || profile.username?.[0]?.toUpperCase() || "U"}
        </div>
        <p className="text-white font-medium">
          {post.owner.username || profile.username}
        </p>
      </div>

      {/* Image */}
      <div className="relative bg-black aspect-square">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 animate-pulse bg-gray-800" />
        )}

        {post.image && !imgError ? (
          <img
            src={post.image}
            alt="post"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Image not available
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-white">
          <Heart className="cursor-pointer hover:text-red-500 transition" />
          <span className="text-sm text-gray-400">
            {post.likes?.length || 0} likes
          </span>
        </div>

        {post.description && (
          <p className="text-gray-300 text-sm">
            <span className="font-medium text-white mr-1">
              {post.owner.username }
            </span>
            {post.description}
          </p>
        )}

        <p className="text-xs text-gray-500">
          {new Date(post.timestamps).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default PostCard;

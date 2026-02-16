import { useState, useRef } from 'react';
import PostDetailsForm from '../components/Postdetailsform';

const CreatePost = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  // Detect if device is mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePostClick = () => {
    fileInputRef.current?.click();
  };

  const handleBack = () => {
    setSelectedImage(null);
    setImageFile(null);
  };

  if (selectedImage) {
    return (
      <PostDetailsForm
        selectedImage={selectedImage}
        imageFile={imageFile}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#18181c] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-linear-to-br from-purple-500 via-pink-500 to-orange-400 p-1 animate-pulse">
                <div className="w-full h-full bg-[#18181c] rounded-full flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Create New Post
            </h1>
            <p className="text-gray-400 text-sm">
              {isMobile
                ? 'Capture a moment or choose from gallery'
                : 'Select a photo to share with your followers'}
            </p>
          </div>

          {/* Create Post Button */}
          <button
            onClick={handleCreatePostClick}
            className="group relative w-full py-4 px-6 bg-linear-to-r from-purple-500 via-pink-500 to-orange-400 rounded-xl font-semibold text-white text-lg shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Select Photo
            </span>
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture={isMobile ? 'environment' : undefined}
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Info text */}
          <div className="pt-4 space-y-2">
            <p className="text-xs text-gray-500">
              {isMobile
                ? 'Camera will open on supported devices'
                : 'Supported formats: JPG, PNG, GIF'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
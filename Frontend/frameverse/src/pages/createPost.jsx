import { useState, useRef } from 'react';
import PostDetailsForm from '../components/posts/Postdetailsform';
import ImageCropper from '../components/posts/ImageCropper';

const CreatePost = () => {
  // Raw image selection from file input
  const [rawImage, setRawImage] = useState(null);

  // Cropped resulting image URL & file for upload
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setRawImage(reader.result);
      reader.readAsDataURL(file);
    }
    // clear input value so picking the same file again works
    e.target.value = null;
  };

  const handleCropComplete = (croppedData) => {
    // croppedData contains { url, file }
    setSelectedImage(croppedData.url);
    setImageFile(croppedData.file);
    setRawImage(null); // Close cropper
  };

  const handleCropCancel = () => {
    setRawImage(null); // Close cropper
  };

  const handleBack = () => {
    setSelectedImage(null);
    setImageFile(null);
    setRawImage(null);
  };

  // 1. Show formulation page if we have our final cropped image
  if (selectedImage) {
    return (
      <PostDetailsForm
        selectedImage={selectedImage}
        imageFile={imageFile}
        onBack={handleBack}
      />
    );
  }

  // 2. Show cropper if we have a raw uncropped image
  if (rawImage) {
    return (
      <ImageCropper
        imageSrc={rawImage}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center space-y-8">

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-1 animate-pulse">
              <div className="w-full h-full bg-bg-primary rounded-full flex items-center justify-center">
                <svg className="w-16 h-16 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Create New Post</h1>
            <p className="text-text-secondary text-sm">
              {isMobile ? 'Capture a moment or choose from your gallery' : 'Select a photo to share with your followers'}
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            {/* Gallery / file picker — always available on all devices */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="group relative w-full py-4 px-6 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 rounded-xl font-semibold text-text-primary text-lg shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Choose from Gallery
              </span>
            </button>

            {/* Camera — mobile only, separate button with capture */}
            {isMobile && (
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-4 px-6 bg-bg-secondary hover:bg-gray-700 border border-border-color rounded-xl font-semibold text-text-primary text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Open Camera
                </span>
              </button>
            )}
          </div>

          {/* Gallery input — no capture attribute so it always opens file picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Camera input — capture forces camera on mobile */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />

          <p className="text-xs text-text-secondary">Supported formats: JPG, PNG, GIF, WEBP</p>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
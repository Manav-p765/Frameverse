import React, { useState, useRef } from "react";

const UpdateProfileModal = ({ profile, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: profile?.username || "",
    bio: profile?.bio || "",
    avatar: profile?.avatar || [],
  });
  const [avatarPreview, setAvatarPreview] = useState(
    profile?.avatar?.[0]?.url || null
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, avatar: "Please select an image file" }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, avatar: "Image size must be less than 5MB" }));
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrors((prev) => ({ ...prev, avatar: "" }));
    }
  };

  const handleRemoveAvatar = () => {
    setSelectedFile(null);
    setAvatarPreview(null);
    setFormData((prev) => ({ ...prev, avatar: [] }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 30) {
      newErrors.username = "Username must be less than 30 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    if (formData.bio && formData.bio.length > 160) {
      newErrors.bio = "Bio must be less than 160 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        username: formData.username,
        bio: formData.bio,
        avatarFile: selectedFile,
      };

      await onSave(updateData);
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: profile?.username || "",
      bio: profile?.bio || "",
      avatar: profile?.avatar || [],
    });
    setAvatarPreview(profile?.avatar?.[0]?.url || null);
    setSelectedFile(null);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        onClick={handleCancel}
        style={{ animation: "fadeIn 0.2s ease-out" }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-800"
          style={{ animation: "slideUp 0.3s ease-out" }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-white">Edit Profile</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Avatar Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-800"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center ring-4 ring-gray-800" style={{ background: "linear-gradient(to bottom right, #3B82F6, #9333EA)" }}>
                      <span className="text-white font-bold text-2xl">
                        {formData.username?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium cursor-pointer transition-colors text-sm"
                  >
                    Change Photo
                  </label>
                  <p className="text-gray-500 text-xs mt-2">
                    JPG, PNG or GIF. Max size 5MB
                  </p>
                </div>
              </div>
              {errors.avatar && (
                <p className="text-red-500 text-sm">{errors.avatar}</p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-300"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className={`w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border ${
                  errors.username
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-700 focus:border-blue-500"
                } focus:outline-none transition-colors`}
                placeholder="Enter your username"
              />
              {errors.username && (
                <p className="text-red-500 text-sm">{errors.username}</p>
              )}
              <p className="text-gray-500 text-xs">
                {formData.username.length}/30 characters
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-300"
              >
                Bio
              </label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                maxLength={160}
                rows="4"
                className={`w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border ${
                  errors.description
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-700 focus:border-blue-500"
                } focus:outline-none transition-colors resize-none`}
                placeholder="Share your passion for movies & anime..."
              />
              {errors.bio && (
                <p className="text-red-500 text-sm">{errors.bio}</p>
              )}
              <p className="text-gray-500 text-xs">
                {formData.bio.length}/160 characters
              </p>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-500 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default UpdateProfileModal;
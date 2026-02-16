import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/post.service"; // your axios instance

const PostDetailsForm = ({ selectedImage, imageFile, onBack }) => {
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("description", description.trim());
      formData.append("location", location.trim());

      await api.post("post/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/");
    } catch (err) {
      console.error("Post creation error:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to create post"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#18181c] pb-safe">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-black">
            <img
              src={selectedImage}
              alt="Selected"
              className="w-full h-full object-cover"
            />
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write a caption..."
            rows={4}
            maxLength={2200}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-[#262626] border border-gray-700 rounded-xl text-white"
          />

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add location"
            maxLength={100}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-[#262626] border border-gray-700 rounded-xl text-white"
          />

          {error && (
            <div className="text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-linear-to-r from-purple-500 via-pink-500 to-orange-400 rounded-xl text-white font-semibold disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Post"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default PostDetailsForm;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/post.service"; // your axios instance
import { generateImageCaption } from "../../services/Geminiai";

const PostDetailsForm = ({ selectedImage, imageFile, onBack }) => {
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiCaption = async () => {
    setAiLoading(true);
    setError("");
    try {
      // selectedImage is a data URL like "data:image/jpeg;base64,/9j/4AAQ..."
      const [header, base64Data] = selectedImage.split(",");
      const mimeType = header.match(/data:(.*?);/)?.[1] || "image/jpeg";
      const caption = await generateImageCaption(base64Data, mimeType);
      setDescription(caption.trim());
    } catch (err) {
      console.error("AI caption error:", err);
      setError("Failed to generate caption. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

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
    <div className="min-h-screen bg-bg-primary pb-safe">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="w-full max-h-[60vh] rounded-2xl overflow-hidden bg-bg-primary flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Selected"
              className="w-full h-full object-contain"
            />
          </div>

          {/* AI Caption Button */}
          <button
            type="button"
            onClick={handleAiCaption}
            disabled={aiLoading || isLoading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-bg-secondary border border-brand-purple/40 text-brand-purple hover:bg-brand-purple/10 hover:border-brand-purple/60 active:scale-[0.98]"
          >
            {aiLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.42" strokeDashoffset="10" strokeLinecap="round" />
                </svg>
                Generating caption...
              </>
            ) : (
              <>
                <span className="text-base">✨</span>
                AI Caption
              </>
            )}
          </button>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write a caption..."
            rows={4}
            maxLength={2200}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-bg-secondary border border-border-color focus:border-brand-purple outline-none rounded-xl text-text-primary transition-colors"
          />

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add location"
            maxLength={100}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-bg-secondary border border-border-color focus:border-brand-purple outline-none rounded-xl text-text-primary transition-colors"
          />

          {error && (
            <div className="text-brand-pink text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-linear-to-r from-purple-500 via-pink-500 to-orange-400 rounded-xl text-text-primary font-semibold disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Post"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default PostDetailsForm;


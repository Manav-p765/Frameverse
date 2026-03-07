import { useState } from "react";
import api from "../../services/post.service";

const EditPostModal = ({ post, isOpen, onClose, onUpdate }) => {
    const [description, setDescription] = useState(post?.description || "");
    const [location, setLocation] = useState(post?.location || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await api.post(`/post/update/${post._id}`, {
                description: description.trim(),
                location: location.trim(),
            });

            onUpdate(response.data.post);
            onClose();
        } catch (err) {
            console.error("Update post error:", err);
            setError(err.response?.data?.message || "Failed to update post");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-bg-primary/70 backdrop-blur-sm z-50 animate-[fadeIn_0.2s_ease-out]"
                onClick={onClose}
            />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div
                    className="bg-bg-primary rounded-2xl w-full max-w-lg shadow-2xl border border-border-color animate-[slideUp_0.3s_ease-out]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-4 border-b border-border-color flex items-center justify-between">
                        <h2 className="text-xl font-bold text-text-primary">Edit Post</h2>
                        <button
                            onClick={onClose}
                            className="text-text-secondary hover:text-text-primary p-1"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-secondary">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-bg-secondary text-text-primary px-4 py-2.5 rounded-lg border border-border-color focus:border-brand-purple focus:outline-none transition-colors resize-none"
                                rows="4"
                                placeholder="What's on your mind?"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-secondary">
                                Location
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full bg-bg-secondary text-text-primary px-4 py-2.5 rounded-lg border border-border-color focus:border-brand-purple focus:outline-none transition-colors"
                                placeholder="Add a location"
                            />
                        </div>

                        {error && <p className="text-brand-pink text-sm">{error}</p>}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 bg-bg-secondary hover:bg-gray-700 text-text-primary rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 bg-brand-purple hover:opacity-90 text-text-primary rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default EditPostModal;

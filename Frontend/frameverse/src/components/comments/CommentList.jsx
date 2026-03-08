import React, { useState, useEffect, useCallback } from 'react';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import axios from 'axios';

const CommentList = ({ postId, currentUser, onCommentAdded, onCommentDeleted }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);

    const fetchComments = useCallback(async (pageNum = 1) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/comments/post/${postId}?page=${pageNum}&limit=20`);
            const newComments = response.data;

            if (pageNum === 1) {
                setComments(newComments);
            } else {
                setComments(prev => [...prev, ...newComments]);
            }

            setHasMore(newComments.length === 20);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching comments:', err);
            setError('Failed to load comments');
            setLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        fetchComments(1);
    }, [fetchComments]);

    const handleCreateComment = async (text) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Optimistic update
        const temporaryId = Date.now().toString();
        const optimisticComment = {
            _id: temporaryId,
            userId: currentUser,
            text,
            createdAt: new Date().toISOString(),
            isOptimistic: true
        };

        setComments(prev => [optimisticComment, ...prev]);
        if (onCommentAdded) onCommentAdded();

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/comments/create`,
                { postId, text },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Replace optimistic comment with real one
            setComments(prev => prev.map(c => c._id === temporaryId ? response.data : c));
        } catch (err) {
            console.error('Error creating comment:', err);
            // Remove optimistic comment on error
            setComments(prev => prev.filter(c => c._id !== temporaryId));
            if (onCommentDeleted) onCommentDeleted(); // Decr counter if failed
            alert('Failed to post comment');
        }
    };

    const handleDeleteComment = async (commentId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/comments/${commentId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setComments(prev => prev.filter(c => c._id !== commentId));
            if (onCommentDeleted) onCommentDeleted();
        } catch (err) {
            console.error('Error deleting comment:', err);
            alert('Failed to delete comment');
        }
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchComments(nextPage);
    };

    if (loading && page === 1) {
        return (
            <div className="flex flex-col gap-4 py-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-bg-secondary/50" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-20 bg-bg-secondary/50 rounded" />
                            <div className="h-10 w-full bg-bg-secondary/50 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="mb-4">
                <CommentInput onSubmit={handleCreateComment} />
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto pr-1 custom-scrollbar">
                {comments.length === 0 ? (
                    <div className="text-center py-10 opacity-40">
                        <p className="text-sm">No comments yet. Be the first to comment!</p>
                    </div>
                ) : (
                    <>
                        {comments.map(comment => (
                            <CommentItem
                                key={comment._id}
                                comment={comment}
                                currentUser={currentUser}
                                onDelete={handleDeleteComment}
                            />
                        ))}

                        {hasMore && (
                            <button
                                onClick={loadMore}
                                className="w-full py-2 text-xs font-semibold text-brand-purple hover:text-brand-purple/80 transition-colors"
                            >
                                Load more comments
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CommentList;

import React from 'react';
import CommentList from './CommentList';

const CommentPanel = ({ postId, currentUser, onCommentAdded, onCommentDeleted }) => {
    return (
        <div className="flex flex-col h-full w-full bg-bg-primary/30 backdrop-blur-sm border-l border-border-color/30 p-5 overflow-hidden">
            <div className="flex-1 overflow-hidden">
                <CommentList
                    postId={postId}
                    currentUser={currentUser}
                    onCommentAdded={onCommentAdded}
                    onCommentDeleted={onCommentDeleted}
                />
            </div>
        </div>
    );
};

export default CommentPanel;

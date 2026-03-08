import React, { useState, useRef } from 'react';
import { Send, Smile, AtSign } from 'lucide-react';

const COMMON_EMOJIS = ["❤️", "✨", "🔥", "😂", "🙌", "😍", "👏", "😮", "😢", "💯", "🎉", "⚡"];

const CommentInput = ({ onSubmit, placeholder = "Add a comment..." }) => {
    const [text, setText] = useState('');
    const [showEmojis, setShowEmojis] = useState(false);
    const inputRef = useRef(null);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (text.trim()) {
            onSubmit(text);
            setText('');
            setShowEmojis(false);
        }
    };

    const handleEmojiClick = (emoji) => {
        setText(prev => prev + emoji);
        setShowEmojis(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="relative">
            {showEmojis && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-bg-secondary border border-border-color rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="grid grid-cols-4 gap-1">
                        {COMMON_EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => handleEmojiClick(emoji)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-bg-primary rounded-lg transition-colors text-lg"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <form
                onSubmit={handleSubmit}
                className="flex items-end gap-2 bg-bg-secondary/30 p-2 rounded-2xl border border-border-color/30 focus-within:border-brand-purple/50 transition-all"
            >
                <div className="flex gap-1 items-center pb-1 pl-1">
                    <button
                        type="button"
                        onClick={() => setShowEmojis(!showEmojis)}
                        className={`p-1.5 transition-colors rounded-lg ${showEmojis ? 'text-brand-purple bg-brand-purple/10' : 'text-text-secondary hover:text-brand-purple'}`}
                        title="Add Emoji"
                    >
                        <Smile size={18} />
                    </button>
                </div>

                <textarea
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={1}
                    className="flex-1 bg-transparent text-text-primary text-sm py-1.5 outline-none resize-none max-h-32 min-h-[36px]"
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                />

                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="p-2 bg-brand-purple text-white rounded-xl hover:bg-brand-purple/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0 mb-0.5"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default CommentInput;

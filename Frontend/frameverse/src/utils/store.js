import { create } from "zustand";

export const useChatStore = create((set) => ({
  chats: [],
  setChats: (chats) => set({ chats }),
  updateChatWithMessage: (message) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat._id === (message.chat?._id ?? message.chat)
          ? { ...chat, lastMessage: message, lastMessageAt: message.createdAt }
          : chat
      ),
    })),
}));
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Feed from "./pages/Feed";
import Auth from "./pages/Auth";
import ProtectedRoute from "./utils/ProtectedRoute";
import Logout from "./components/auth/logout";
import Chats from "./pages/Chats";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Notifications from "./pages/Notifications";
import Reels from "./pages/Reels";
import CreatePost from "./pages/createPost";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/logout" element={<Logout />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Feed />} />

          {/*
           * /chats/*  — the /* is required so nested routes inside
           * Chats.jsx (e.g. /chats/:id, /chats/:id/info, /chats/new)
           * are matched correctly by React Router.
           *
           * The redundant <Route path="/chats"> redirect has been removed —
           * navigating to /chats hits /chats/* with no sub-path, which
           * renders the chat list index route inside Chats.jsx.
           */}
          <Route path="/chats/*" element={<Chats />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/create" element={<CreatePost />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
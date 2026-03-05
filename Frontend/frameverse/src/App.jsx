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
import AutoPostPage from "./pages/AutoPostPage";
import MessageToast from "./components/chat/MessageToast";
import CallProvider from "./components/call/CallProvider";
import { ThemeProvider } from "./context/ThemeContext";
import Terms from "./pages/TermsOfService";
import Privacy from "./pages/Privacy";
import ResetPassword from "./pages/ResetPassword";

const App = () => {
  return (
    <ThemeProvider>
      <CallProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<Terms />} /> 
          <Route path="/privacy" element={<Privacy />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Feed />} />

            <Route path="/chats/*" element={<Chats />} />

            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/reels" element={<Reels />} />
            <Route path="/create" element={<CreatePost />} />
            <Route path="/autopost" element={<AutoPostPage />} />

          </Route>
        </Routes>
        <MessageToast />
      </CallProvider>


    </ThemeProvider>

  );
};

export default App;
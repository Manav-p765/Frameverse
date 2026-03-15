/**
 * App — Root Component
 *
 * Defines all application routes wrapped in ThemeProvider and CallProvider.
 * Public routes (landing, auth, password reset) are accessible without login.
 * All other routes go through ProtectedRoute which checks JWT auth,
 * initializes the socket connection, and wraps content in MainLayout.
 * Push notifications are initialized here via usePushNotifications hook.
 */
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./utils/ProtectedRoute";
import Logout from "./components/auth/logout";
import MessageToast from "./components/chat/MessageToast";
import CallProvider from "./components/call/CallProvider";
import { ThemeProvider } from "./context/ThemeContext";
import usePushNotifications from './hooks/usePushNotifications';

// Lazy load page components for better First Contentful Paint (FCP)
const Feed = lazy(() => import("./pages/Feed"));
const Auth = lazy(() => import("./pages/Auth"));
const Chats = lazy(() => import("./pages/Chats"));
const Profile = lazy(() => import("./pages/Profile"));
const Explore = lazy(() => import("./pages/Explore"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Reels = lazy(() => import("./pages/Reels"));
const CreatePost = lazy(() => import("./pages/createPost"));
const AutoPostPage = lazy(() => import("./pages/AutoPostPage"));
const UserAnalytics = lazy(() => import("./pages/UserAnalytics"));
const Terms = lazy(() => import("./pages/TermsOfService"));
const Privacy = lazy(() => import("./pages/Privacy"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const VerifyOtp = lazy(() => import("./pages/VerifyOtp"));
const AnalyticsDashboard = lazy(() => import("./pages/dashboard/AnalyticsDashboard"));
const EngagementDashboard = lazy(() => import("./pages/dashboard/EngagementDashboard"));
const LandingPage = lazy(() => import("./pages/LandingPage"));

const App = () => {
  // Register service worker & subscribe to push notifications
  usePushNotifications();

  return (
    <ThemeProvider>
      <CallProvider>

        <Suspense fallback={
          <div className="flex h-screen items-center justify-center bg-bg-primary text-text-primary/50 text-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-border-color border-t-white rounded-full animate-spin" />
              <p>Loading...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
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
              <Route path="/dashboard/analytics" element={<AnalyticsDashboard />} />
              <Route path="/dashboard/engagement" element={<EngagementDashboard />} />
              <Route path="/profile/insights" element={<EngagementDashboard />} />
              <Route path="/autopost" element={<AutoPostPage />} />

            </Route>
          </Routes>
        </Suspense>
        <MessageToast />
      </CallProvider>


    </ThemeProvider>

  );
};

export default App;
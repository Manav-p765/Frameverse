import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Feed from './pages/Feed';
import Auth from './pages/Auth';
import ProtectedRoute from "./utils/ProtectedRoute"
import Logout from './components/logout';
import Chats from './pages/Chats'
import Profile from './pages/Profile'
import Explore from './pages/Explore';
import Notifications from './pages/Notifications';
import Reels from './pages/Reels';

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Feed />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/reels" element={<Reels />} />
        </Route>

        <Route path="/logout" element={<Logout />} />
      </Routes>
    </div>
  )
};

export default App;


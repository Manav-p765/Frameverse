import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Feed from './pages/Feed';
import Auth from './pages/Auth';
import ProtectedRoute from "./utils/ProtectedRoute"
import Logout from './components/logout';

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/feed" element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
          } />

          <Route path="/logout" element={<Logout />} />
      </Routes>
    </div>
  )
};

export default App;


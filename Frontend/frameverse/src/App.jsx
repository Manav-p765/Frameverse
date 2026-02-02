import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Feed from './pages/Feed';
import Register from './pages/Login';

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/feed" element={<Feed />} />
      </Routes>
    </div>
  )
};

export default App;


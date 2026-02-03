import React, { useState, useEffect } from 'react'
import api from "../services/post.service"
import { useNavigate } from 'react-router-dom';

const Feed = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await api.get("/user/feed");
        setPosts(res.data);
      } catch (err) {
        // 401 is already handled by interceptor
        console.error("Failed to fetch feed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  return (
    <div>

      <h1>Feed</h1>
      <button onClick={() => navigate("/logout")}>
        Logout
      </button>


      {posts.length === 0 ? (
        <p>No posts found</p>
      ) : (
        posts.map((post, index) => (
          <div key={post._id || index} style={{ border: "1px solid gray", margin: 8 }}>
            <p><strong>RAW POST:</strong></p>
            <pre>{JSON.stringify(post, null, 2)}</pre>
          </div>
        ))
      )}
    </div>
  )
}

export default Feed;
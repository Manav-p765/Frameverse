import React, { useState, useEffect } from 'react'
import { getFeed } from '../services/post.service';

const Feed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeed = async () => {
            const res = await getFeed();
            setPosts(res.data);
            setLoading(false);
        };

        fetchFeed();
    }, []);

    return (
        <div>
            
    <h1>Feed</h1>

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
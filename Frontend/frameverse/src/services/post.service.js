import axios from 'axios';

const post = axios.create({
    baseURL: 'http://localhost:8080/user',
    withCredentials: true,
});

post.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
})

export const getFeed = ()=> post.get("/feed");
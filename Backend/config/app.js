import express from "express";

const app = express();


//middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true}));

app.get("/", (req, res) => {
    res.send("server is running");
});

export default app;
import jwt from "jsonwebtoken";

export const sendToken = (user, res, statusCode, message) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic ?? null,
    },
  });
};
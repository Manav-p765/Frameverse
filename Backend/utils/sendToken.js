import jwt from "jsonwebtoken";

export const sendToken = (user, res, statusCode, message) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(statusCode).json({
    success: true,
    message,
    token, // ⭐ FRONTEND WILL USE THIS
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
    },
  });
};
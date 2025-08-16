import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId, rememberMe = false) => {
  const expiresIn = rememberMe ? '30d' : '1d';
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge
  });

  return token;
};
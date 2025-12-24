import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export default async (req, res, next) => {
  try {
    // 1. Get token from header
    const jwtToken = req.header("token");

    if (!jwtToken) {
      console.log("Auth Middleware: No token found in header");
      return res.status(403).json("Not Authorized");
    }

    // 2. Verify token
    const payload = jwt.verify(jwtToken, process.env.JWT_SECRET);

    req.user = payload.user;
    console.log("Auth Middleware: User verified. ID:", req.user.id);
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    return res.status(403).json("Not Authorized");
  }
};

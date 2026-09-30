import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// Protect routes - verifies JWT from Authorization header or cookie
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }

  try {
    // Verify token
    console.log("Token received:", token); // Debugging line
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded); // Debugging line

    // Find user by ID from the token
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized, user not found");
    }

    // Check if the user is active
    if (!req.user.isActive) {
      res.status(403);
      throw new Error("Not authorized, user account is inactive");
    }

    next();
  } catch (error) {
    console.error("Token verification error:", error.message); // Debugging line
    res.status(401);
    throw new Error("Not authorized, token failed");
  }
});

// Role-based access control
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user?.role}' is not authorized to access this resource`);
    }
    next();
  };
};
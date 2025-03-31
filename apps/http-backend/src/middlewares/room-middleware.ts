import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {JWT_SECRET} from '@repo/backend-common/config'
import prisma from "@repo/db/prisma";

interface AuthRequest extends Request {
  email: string;
  token: string;
}

export function roomMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"] ?? "";
  if (!authHeader) {
    return res.status(401).json({ message: "No authorization header" });
  }

  const [bearer, token] = authHeader.split(" ");
  if (bearer !== "Bearer" || !token) {
    return res.status(401).json({ message: "Invalid authorization format" });
  }

  try {
    const tokenData = jwt.verify(
      token,
      JWT_SECRET || ""
    ) as jwt.JwtPayload;

    if (!tokenData || typeof tokenData.email !== "string") {
      return res.status(401).json({ message: "Invalid token payload" });
    }
    req.token = token;
    
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

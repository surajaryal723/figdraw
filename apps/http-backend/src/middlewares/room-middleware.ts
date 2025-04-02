import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {JWT_SECRET} from '@repo/backend-common/config'
import prisma from "@repo/db/prisma";

export interface AuthRequest extends Request{
  userId:string,
  token:string
}
export async function roomMiddleware(
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

    if (!tokenData || typeof tokenData.id !== "string") {
      return res.status(401).json({ message: "Invalid token payload" });
    }
    let user=await prisma.user.findUnique({
      where:{
        id:tokenData.id
      },
      select:{
        id:true
      }
    })
    if(!user){
      res.json({
        message:'No user exist with provided token'
      })
      return;
    }
    req.userId=user.id
    req.token=token
    
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

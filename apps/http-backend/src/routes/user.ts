import {
  Router,
  Request,
  Response,
  RequestHandler,
  NextFunction,
} from "express";
import { userSignupSchema, userSigninSchema } from "@repo/common/validation";
import { roomMiddleware, AuthRequest } from "../middlewares/room-middleware";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import prisma from "@repo/db/prisma";
import bcrypt from "bcrypt";

const router: Router = Router();

const signupHandler: RequestHandler = async (req, res) => {
  try {
    const { username, email, password } = userSignupSchema.parse(req.body);

    let checkUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (checkUser) {
      res.status(401).json({
        message: "Email or username already exists!",
      });
      return;
    }

    let hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    res.status(200).json({
      message: "Signup successful",
    });
  } catch (e: any) {
    res.status(401).json({
      message: e.issues[0].message || "Something went wrong!",
    });
  }
};

router.post("/signup", signupHandler);

const signinHandler: RequestHandler = async (req, res) => {
  try {
    const { email, password } = userSigninSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        password: true,
        id: true,
      },
    });

    if (!user) {
      res.status(401).json({
        message: "Email is not registered!",
      });
      return;
    }
    let comparePassword = await bcrypt.compare(password, user.password);

    if (!comparePassword) {
      res.status(401).json({
        message: "Incorrect password!",
      });
      return;
    }

    let token = jwt.sign({ id: user.id }, JWT_SECRET || "");

    res.status(200).send({ message: "Signed In", token });
  } catch (err: any) {
    console.error("Signin error:", err);
    res.json({
      message: "Signin failed!",
      error: err.message,
    });
  }
};

router.post("/signin", signinHandler);

router.post(
  "/room",
  // @ts-ignore
  roomMiddleware,
  async (req: AuthRequest, res: Response) => {
    let slug = req.body.slug;
    let adminId = req.userId;
    try {
      let checkSlug = await prisma.room.findUnique({
        where: {
          slug,
        },
      });
      if (checkSlug) {
        res.json({
          message: "Slug already exists!",
        });
        return;
      }

      let room = await prisma.room.create({
        data: {
          adminId,
          slug,
        },
      });
      if (room) {
        res.json({
          message: "Room created successfully!",
          roomId: room.id,
        });
        return;
      }
      res.json({
        message: "Unable to create room",
      });
    } catch (e) {
      res.json({
        message: "Something went wrong!",
      });
    }
  }
);

router.get(
  "/chats",
  // @ts-ignore
  roomMiddleware,
  async (req: AuthRequest, res: Response) => {
    let roomId = req.query.roomId;
   
    try {
  
      let user = await prisma.user.findUnique({
        where: {
          id: req.userId
        },
        select: {
          username: true,
        },
      });
      res.json({
        message: `Hello ${user?.username} Roomid ${roomId}`,
      });
      return;
    } catch (e) {
      res.json({
        message: "Invalid token!",
      });
    }
  }
);

export { router };

import {
  Router,
  Request,
  Response,
  RequestHandler,
  NextFunction,
} from "express";
import { userSignupSchema, userSigninSchema } from "@repo/common/validation";
import { roomMiddleware } from "../middlewares/room-middleware";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import prisma from "@repo/db/prisma"
import bcrypt from "bcrypt"

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

    res.status(201).json({
      message: "Signup successful",
    });
  } catch (err: any) {
    if (err instanceof Error) {
      res.status(400).json({
        message: err.message || "Invalid input data",
      });
      return;
    }

    res.status(500).json({
      message: "Signup failed due to internal server error!",
    });
  }
};

router.post("/signup", signupHandler);

router.post("/signin", (req: Request, res: Response) => {
  try {
    const validatedData = userSigninSchema.parse(req.body);
   
    
    let token = jwt.sign({ email: validatedData.email }, JWT_SECRET || "");
    
    
    res.status(200).send({ message: "Signed In", token });
  } catch (err: any) {
    console.error("Signin error:", err);
    res.json({
      message: "Signin failed!",
      error: err.message,
    });
  }
});
// @ts-ignore
router.post("/room", roomMiddleware, (req: Request, res: Response) => {
  res.json({
    // @ts-ignore
    email: req.email,
    // @ts-ignore
    token: req.token,
  });
});
export { router };

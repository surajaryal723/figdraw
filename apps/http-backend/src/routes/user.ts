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

const router: Router = Router();

router.post("/signup", (req: Request, res: Response) => {
  try {
    const validatedData = userSignupSchema.parse(req.body);
    res.status(200).json({
      message: "Signup successful",
      data: validatedData,
      secret: JWT_SECRET,
    });
  } catch (err: any) {
    res.json({
      message: "Signup failed!",
      error: err.errors[0].message,
    });
  }
});
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

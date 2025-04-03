import dotenv, { parse } from "dotenv";
dotenv.config();
import { WebSocketServer, WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
const wss = new WebSocketServer({ port: 8080 });
import { JWT_SECRET } from "@repo/backend-common/config";
import prisma from "@repo/db/prisma";

interface User {
  socket: WebSocket;
  rooms: string[];
  userId: string;
}

const users: User[] = [];

async function checkUser(token: string): Promise<string|null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET || "") as JwtPayload;

    if (!decoded || typeof decoded.id !== "string" || !decoded.id) {
      return null;
    }

    let user=await prisma.user.findUnique({
        where:{
            id:decoded.id
        }
    })
    if(!user){
        return null
    }

    return decoded.id;
  } catch (err) {
    return null;
  }
}

wss.on("connection", async(socket, request) => {
  const url = request.url;
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const userId = await checkUser(token);

  if (!userId) {
    socket.close();
    return;
  }
  users.push({
    socket,
    rooms: [],
    userId,
  });

  socket.on("message", async (data) => {
    const parsedData = JSON.parse(data as unknown as string);

    if (parsedData.type === "join") {
      const user = users.find((x) => x.socket === socket);
      user?.rooms.push(parsedData.roomId);
    }

    if (parsedData.type === "leave") {
      const user = users.find((x) => x.socket === socket);
      if (!user) {
        return;
      }

      user.rooms = user.rooms.filter((x) => {
        return x !== parsedData.roomId;
      });
    }

    if (parsedData.type === "chat") {
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      await prisma.chat.create({
        data: {
          message: parsedData.message,
          roomId:parseInt(parsedData.roomId),
          userId
        }
      });

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.socket.send(
            JSON.stringify({
              type: "chat",
              message: message,
              roomId: roomId,
            })
          );
        }
      });
    }
  });
});

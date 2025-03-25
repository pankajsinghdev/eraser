import { prismaClient } from "@repo/db/client";
import jwt from "jsonwebtoken";
import { WebSocket, WebSocketServer } from "ws";
import { JWT_SECRET } from "@repo/backend-common/config";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: number[];
  userId: number;
}

const users: User[] = [];

function checkUser(token: string): number | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET || "");

    if (typeof decoded === "string") {
      return null;
    }

    if (!decoded || !decoded.userId) {
      return null;
    }
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

wss.on("connection", function connection(ws, request) {
  const url = request.url;
  if (!url) {
    return "URL not found";
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);

  const token = queryParams.get("token") || "";

  const userId = checkUser(token);

  if (!userId) {
    ws.close();
    return;
  }

  users.push({
    userId,
    rooms: [],
    ws,
  });

  ws.on("message", async function message(data) {
    const parsedData = JSON.parse(data as unknown as string);
    if (parsedData.type === "join_room") {
      const user = users.find((user) => user.ws === ws);
      user?.rooms.push(parsedData.roomId);
    }
    if (parsedData.type === "leave_room") {
      const user = users.find((user) => user.ws === ws);
      if (!user) {
        return;
      }
      user.rooms = user?.rooms.filter((x) => x === parsedData.roomId);
    }

    if (parsedData.type === "chat") {
      const roomId = parsedData.roomId;
      const message = parsedData.message;
      await prismaClient.chat.create({
        data: {
          roomId: Number(roomId),
          message,
          userId,
        },
      });

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              message: message,
              roomId,
            })
          );
        }
      });
    }
  });
});

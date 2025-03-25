import { User } from "./../../../node_modules/.pnpm/@prisma+client@6.3.1_prisma@6.3.1_typescript@5.7.3__typescript@5.7.3/node_modules/.prisma/client/index.d";
import { prismaClient } from "@repo/db/client";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { middleware } from "./middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import {
  CreateRoomSchema,
  CreateUserSchema,
  SignInSchema,
} from "@repo/common/types";
import * as bcrypt from "bcrypt";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const saltRounds = 10;

function excludePassword(user: User) {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

app.post("/signup", async (req: Request, res: Response) => {
  const data = CreateUserSchema.safeParse(req.body);
  if (!data.success) {
    res.json({
      message: data.error,
    });
    return;
  }

  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(data.data.password, salt);

  try {
    const user = await prismaClient.user.create({
      data: {
        email: data.data.email,
        name: data.data.name,
        password: hashedPassword,
      },
    });

    res.json({
      userId: user.id,
    });
  } catch (e) {
    res.status(411).json({
      message: e,
    });
  }
});

app.post("/signin", async (req, res) => {
  const data = SignInSchema.safeParse(req.body);
  if (!data.success) {
    res.json({
      message: "Incorrect inputs",
    });
    return;
  }
  const payload = data.data;

  try {
    const user = await prismaClient.user.findFirst({
      where: {
        email: payload.email,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    const isMatch = await bcrypt.compare(payload.password, user.password);
    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET
    );
    if (isMatch) {
      res.json({
        user: excludePassword(user),
        token,
      });
    } else {
      res.status(401).send({
        message: "Invalid Credentials",
      });
    }
  } catch (e) {
    res.status(411).json({
      message: e,
    });
  }
});

app.post("/room", middleware, async (req, res) => {
  const payload = req.body;

  const data = CreateRoomSchema.safeParse(payload);
  if (!data.success) {
    res.json({
      message: "Incorrect credentials",
    });
    return;
  }
  const userId = req.userId;
  if (!userId) {
    res.status(401).send({
      message: "User id not found",
    });
    return;
  }
  const room = await prismaClient.rooms.create({
    data: {
      slug: data.data.name,
      adminId: +userId,
    },
  });
  res.json({
    roomId: room.id,
  });
});

app.get("/chats/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId);
  const messages = await prismaClient.chat.findMany({
    where: {
      roomId: roomId,
    },
    take: 50,
    orderBy: {
      id: "desc",
    },
  });

  res.json({
    messages,
  });
});

app.get("/room/:slug", async (req, res) => {
  const slug = req.params.slug;
  const room = await prismaClient.rooms.findFirst({
    where: {
      slug: slug,
    },
  });

  res.json({
    room,
  });
});

app.get("/user", (request, response) => {
  const payload = request.body;
  const user = "hello";
  response.send(user);
});

app.delete("/user/:id", (request, response) => {
  const payload = request.body;
  const user = "hello";
  response.send(user);
});

app.listen(3001);

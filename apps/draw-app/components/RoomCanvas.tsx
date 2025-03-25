"use client";

import { useEffect, useRef, useState } from "react";
import { WS_URL } from "../config";
import { Canvas } from "./Canvas";
import DrawClass from "../classes/Draw";

export default function RoomCanvas({ roomId }: { roomId: number }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImlhdCI6MTc0MjIzNDcwNn0.IRM6n_oa7q80MsW0mgQVQntf4DyN4o0Gf8cP5hMwRGk`
    );
    ws.onopen = () => {
      setSocket(ws);
      ws.send(
        JSON.stringify({
          type: "join_room",
          roomId,
        })
      );
    };
  }, []);

  if (!socket) {
    return <div>Connecting to Server...</div>;
  }

  return (
    <div className="h-[100vh] ">
      <Canvas roomId={roomId} socket={socket} />
    </div>
  );
}

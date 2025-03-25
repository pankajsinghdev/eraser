import axios from "axios";
import { BACKEND_URL } from "../../config";

export type Shapes =
  | {
      type: "rectangle";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
    };

export async function draw(
  canvas: HTMLCanvasElement,
  roomId: number,
  socket: WebSocket
) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const existingShapes: Shapes[] = await getExistingShapes(roomId);
  console.log("existingShapes", existingShapes);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type === "chat") {
      const parsedShape = JSON.parse(message.message);
      existingShapes.push(parsedShape.shape);
      clearCanvas(existingShapes, canvas, ctx);
    }
  };

  clearCanvas(existingShapes, canvas, ctx);

  let clicked = false;
  let startX = 0;
  let startY = 0;

  canvas.addEventListener("mousedown", (e) => {
    clicked = true;
    startX = e.clientX;
    startY = e.clientY;
  });

  canvas.addEventListener("mouseup", (e) => {
    clicked = false;
    const width = e.clientX - startX;
    const height = e.clientY - startY;
    const shape: Shapes = {
      type: "rectangle",
      x: startX,
      y: startY,
      width,
      height,
    };
    existingShapes.push(shape);

    socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({ shape }),
        roomId: roomId,
      })
    );
  });

  canvas.addEventListener("mousemove", (e) => {
    if (clicked) {
      const width = e.clientX - startX;
      const height = e.clientY - startY;
      clearCanvas(existingShapes, canvas, ctx);
      ctx.strokeRect(startX, startY, width, height);
      ctx.strokeStyle = "white";
    }
  });
}

function clearCanvas(
  existingShapes: Shapes[],
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  existingShapes.map((shape) => {
    if (shape.type === "rectangle") {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      ctx.strokeStyle = "white";
    }
  });
}
async function getExistingShapes(roomId: number) {
  const res = await axios.get(`${BACKEND_URL}/chats/${roomId}`);
  const messages = res.data.messages;

  const shapes = messages.map((x: { message: string }) => {
    const messageData = JSON.parse(x.message);
    return messageData.shape;
  });

  return shapes;
}

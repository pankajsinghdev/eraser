import axios from "axios";
import { BACKEND_URL } from "../config";
import getExistingShapes from "../components/http";

type Shapes =
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
    }
  | {
      type: "pencil";
      points: Array<{ x: number; y: number }>;
    };

export type Tools = "rectangle" | "circle" | "pencil";

export default class DrawClass {
  private existingShapes: Shapes[] = [];
  private roomId: number;
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private socket: WebSocket;
  private clicked: boolean;
  private startX: number = 0;
  private startY: number = 0;
  private selectedTool: Tools | null;
  private canvasLeftOffset: number = 0;
  private pencilPoints: Array<{ x: number; y: number }> = [];

  constructor(roomId: number, canvas: HTMLCanvasElement, socket: WebSocket) {
    this.ctx = canvas.getContext("2d")!;
    this.roomId = roomId;
    this.canvas = canvas;
    this.socket = socket;
    this.clicked = false;
    this.init();
    this.initHandler();
    this.initMouseHandler();
    this.selectedTool = null;
    this.canvasLeftOffset = this.canvas.offsetLeft;
  }

  setTool(tool: Tools) {
    console.log("tool", tool, this.selectedTool);
    this.selectedTool = tool;
  }

  async init() {
    this.existingShapes = await getExistingShapes(this.roomId);
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.clearCanvas();
  }

  initHandler() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "chat") {
        const parsedShape = JSON.parse(message.message);
        this.existingShapes.push(parsedShape.shape);
        this.clearCanvas();
      }
    };
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.existingShapes.map((shape) => {
      this.ctx.strokeStyle = "white";

      if (shape.type === "rectangle") {
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === "circle") {
        this.ctx.beginPath();
        this.ctx.arc(
          shape.centerX,
          shape.centerY,
          Math.abs(shape.radius),
          0,
          Math.PI * 2
        );
        this.ctx.stroke();
      } else if (shape.type === "pencil") {
        // Draw the entire pencil path
        if (shape.points && shape.points.length > 0) {
          this.ctx.beginPath();
          this.ctx.lineWidth = 2;
          this.ctx.lineCap = "round";

          // Start from the first point
          this.ctx.moveTo(shape.points[0].x, shape.points[0].y);

          // Draw lines to each subsequent point
          for (let i = 1; i < shape.points.length; i++) {
            this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          this.ctx.stroke();
        }
      }
    });
  }

  initMouseHandler() {
    this.canvas.addEventListener("mousedown", (e) => {
      this.clicked = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.ctx.strokeStyle = "white";

      if (this.selectedTool === "pencil") {
        this.pencilPoints = [{ x: this.startX, y: this.startY }];
      }
    });
    this.canvas.addEventListener("mouseup", (e) => {
      this.clicked = false;
      const width = e.clientX - this.startX;
      const height = e.clientY - this.startY;
      console.log("event", e);
      let shape: Shapes | null = null;
      if (this.selectedTool === "rectangle") {
        shape = {
          type: "rectangle",
          x: this.startX,
          y: this.startY,
          width,
          height,
        };
      } else if (this.selectedTool === "circle") {
        const radius = Math.max(width, height) / 2;
        shape = {
          type: "circle",
          radius: Math.abs(radius),
          centerX: this.startX + radius,
          centerY: this.startY + radius,
        };
      } else if (this.selectedTool === "pencil") {
        // Add the final point and save the entire path
        this.pencilPoints.push({ x: e.clientX, y: e.clientY });
        shape = {
          type: "pencil",
          points: [...this.pencilPoints],
        };
      }
      console.log("shape", shape);
      if (!shape) {
        return;
      }
      this.existingShapes.push(shape);

      this.socket.send(
        JSON.stringify({
          type: "chat",
          message: JSON.stringify({ shape }),
          roomId: this.roomId,
        })
      );
    });

    this.canvas.addEventListener("mousemove", (e) => {
      if (this.clicked) {
        const width = e.clientX - this.startX;
        const height = e.clientY - this.startY;

        if (this.selectedTool === "rectangle") {
          this.clearCanvas();
          this.ctx.strokeRect(this.startX, this.startY, width, height);
        } else if (this.selectedTool === "circle") {
          console.log("circle event", e);
          const radius = Math.max(width, height) / 2;
          const centerX = this.startX + radius;
          const centerY = this.startY + radius;
          this.clearCanvas();

          this.ctx.beginPath();
          this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
          this.ctx.stroke();
        } else if (this.selectedTool === "pencil") {
          console.log("pencil event", e);
          this.pencilPoints.push({ x: e.clientX, y: e.clientY });

          this.ctx.beginPath();
          this.ctx.lineWidth = 2;
          this.ctx.lineCap = "round";
          this.ctx.moveTo(this.startX, this.startY);
          this.ctx.lineTo(e.clientX, e.clientY);
          this.ctx.stroke();

          // Update the start position for the next segment
          this.startX = e.clientX;
          this.startY = e.clientY;
        }
      }
    });
  }
}

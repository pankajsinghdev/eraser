import { useEffect, useRef, useState } from "react";
import { Square, Circle, Pencil } from "lucide-react";
import DrawClass, { Tools } from "../classes/Draw";

export function Canvas({
  roomId,
  socket,
}: {
  roomId: number;
  socket: WebSocket;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<Tools>("circle");
  const [game, setGame] = useState<DrawClass>();

  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  useEffect(() => {
    if (canvasRef.current) {
      const g = new DrawClass(roomId, canvasRef.current, socket);
      setGame(g);
    }
  }, [canvasRef]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ touchAction: "none" }}
        height={window.innerHeight}
        width={window.innerWidth} // Prevents touch scrolling
      ></canvas>
      <div className="absolute left-0 bottom-0 gap-2">
        <button
          className="p-2 m-2 bg-blue-500 rounded-md cursor-pointer"
          onClick={() => {
            setSelectedTool("rectangle");
          }}
        >
          <Square />
        </button>
        <button
          className="p-2 m-2 bg-blue-500 rounded-md cursor-pointer"
          onClick={() => {
            setSelectedTool("circle");
          }}
        >
          <Circle />
        </button>
        <button
          className="p-2 m-2 bg-blue-500 rounded-md cursor-pointer"
          onClick={() => {
            setSelectedTool("pencil");
          }}
        >
          <Pencil />
        </button>
      </div>
    </div>
  );
}

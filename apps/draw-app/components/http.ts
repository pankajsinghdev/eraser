import axios from "axios";
import { BACKEND_URL } from "../config";

export default async function getExistingShapes(roomId: number) {
  const res = await axios.get(`${BACKEND_URL}/chats/${roomId}`);
  const messages = res.data.messages;

  const shapes = messages.map((x: { message: string }) => {
    const messageData = JSON.parse(x.message);
    return messageData.shape;
  });
  console.log("shapes", shapes);
  return shapes;
}

import axios from "axios";
import { BACKEND_URL } from "../../config";
import { ChatRoom } from "../../component/ChatRoom";

async function getRoom(slug: string) {
  const response = await axios.get(`${BACKEND_URL}/room/${slug}`);
  return response.data.room.id;
}
export default async function ChatRoom1({
  params,
}: {
  params: {
    slug: string;
  };
}) {

  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;
  const roomId = await getRoom(slug);

  return <ChatRoom id={roomId}></ChatRoom>;
}

import { useState, useEffect, useRef } from "react";
import { Button } from "react-bootstrap";
import NewChatModal from "../../components/NewChatModal";
import ChatRooms from "../../components/Chat/ChatRooms";
import ChatWindow from "../../components/Chat/ChatWindow";
import { listChatRooms } from "../../services/chats";
import { getCurrentUser } from "../../services/auth";
import { getUsers } from "../../api/api";

export default function MessagePage() {
  const [showModal, setShowModal] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [activeChatRoom, setActiveChatRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [myId, setMyId] = useState(null);
  const currentUser = getCurrentUser();
  const usersRef = useRef([]);
  const myIdRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const rooms = await listChatRooms();
        const allUsers = await getUsers().catch(() => []);
        setUsers(allUsers);
        usersRef.current = allUsers;
        const me = allUsers.find((u) => u.email === currentUser?.email);
        const resolvedId = me?.id ?? currentUser?.id;
        setMyId(resolvedId);
        myIdRef.current = resolvedId;
        const myRooms = rooms.filter((room) =>
          room.members?.some((m) => m.userId === resolvedId)
        );
        setChatRooms(enrichRooms(myRooms, allUsers, resolvedId));
      } catch (err) {
        console.error("Could not load chat rooms", err);
      }
    }

    load();

    const interval = setInterval(async () => {
      try {
        const rooms = await listChatRooms();
        const myRooms = rooms.filter((room) =>
          room.members?.some((m) => m.userId === myIdRef.current)
        );
        setChatRooms(enrichRooms(myRooms, usersRef.current, myIdRef.current));
      } catch (err) {}
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  function enrichRooms(rooms, allUsers, currentUserId) {
    return rooms.map((room) => {
      const other = room.members?.find((m) => m.userId !== currentUserId);
      const otherUser = allUsers.find((u) => u.id === other?.userId);
      return { ...room, name: otherUser?.name || "Ukendt" };
    });
  }

  function handleStartChat(chatRoom) {
    const enriched = enrichRooms([chatRoom], users, myId)[0];
    setChatRooms((prev) =>
      prev.some((r) => r.id === chatRoom.id) ? prev : [enriched, ...prev]
    );
    setActiveChatRoom(enriched);
  }

  return (
    <div className="d-flex" style={{ height: "calc(100vh - 80px)" }}>

      {/* Left */}
      <div className="border-end overflow-auto" style={{ width: 300 }}>
        <div className="p-3">
          <Button className="w-100" onClick={() => setShowModal(true)}>Ny Chat</Button>
        </div>
        <ChatRooms
          chatRooms={chatRooms}
          onSelectRoom={setActiveChatRoom}
          activeChatRoomId={activeChatRoom?.id}
        />
      </div>

      {/* Right */}
      <div className="flex-grow-1 d-flex flex-column">
        {activeChatRoom ? (
          <>
            <div className="p-3 border-bottom fw-bold">{activeChatRoom.name}</div>
            <ChatWindow chatRoom={activeChatRoom} users={users} />
          </>
        ) : (
          <div className="d-flex align-items-center justify-content-center h-100 text-muted">
            Vælg en chat for at begynde
          </div>
        )}
      </div>

      <NewChatModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onStartChat={handleStartChat}
      />
    </div>
  );
}

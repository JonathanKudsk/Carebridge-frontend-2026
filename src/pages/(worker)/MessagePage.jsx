import { useState, useEffect, useRef } from "react";
import { Button } from "react-bootstrap";
import NewChatModal from "../../components/NewChatModal";
import ChatRooms from "../../components/Chat/ChatRooms";
import ChatWindow from "../../components/Chat/ChatWindow";
import { listChatRooms } from "../../services/chats";
import { getMessages } from "../../services/messages";
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
        const enriched = enrichRooms(myRooms, allUsers, resolvedId);
        setChatRooms(await attachLastMessages(enriched));
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
        const enriched = enrichRooms(myRooms, usersRef.current, myIdRef.current);
        setChatRooms((prev) =>
          enriched.map((room) => {
            const existing = prev.find((r) => r.id === room.id);
            return existing?.message ? { ...room, message: existing.message } : room;
          })
        );
      } catch (err) {
        console.error("Could not load chat rooms", err);
        // polling errors are non-critical
      }
    }, 5000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function attachLastMessages(rooms) {
    return Promise.all(
      rooms.map(async (room) => {
        try {
          const msgs = await getMessages(room.id);
          const last = msgs[msgs.length - 1];
          return last ? { ...room, message: last.message } : room;
        } catch {
          return room;
        }
      })
    );
  }

  function enrichRooms(rooms, allUsers, currentUserId) {
    return rooms.map((room) => {
      const others = room.members?.filter((m) => m.userId !== currentUserId) ?? [];
      const names = others.map((m) => allUsers.find((u) => u.id === m.userId)?.name || "Ukendt");
      return { ...room, name: names.join(", ") || "Ukendt" };
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
            <ChatWindow
            chatRoom={activeChatRoom}
            users={users}
            onLastMessage={(roomId, text) =>
              setChatRooms((prev) =>
                prev.map((r) => (r.id === roomId ? { ...r, message: text } : r))
              )
            }
          />
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

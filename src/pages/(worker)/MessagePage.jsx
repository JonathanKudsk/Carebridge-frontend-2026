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
  const PAGE_SIZE = 5;
  const [showModal, setShowModal] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [activeChatRoom, setActiveChatRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [myId, setMyId] = useState(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const currentUser = getCurrentUser();
  const usersRef = useRef([]);
  const myIdRef = useRef(null);
  const pageRef = useRef(0);

  useEffect(() => {
    async function load() {
      try {
        const response = await listChatRooms({ page: 0, size: PAGE_SIZE });
        const rooms = response.chatRooms ?? response;
        const total = response.totalCount ?? rooms.length;
        const allUsers = await getUsers().catch(() => []);
        setUsers(allUsers);
        usersRef.current = allUsers;
        const me = allUsers.find((u) => u.email === currentUser?.email);
        const resolvedId = me?.id ?? currentUser?.id;
        setMyId(resolvedId);
        myIdRef.current = resolvedId;
        setTotalCount(total);
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
        const loadedSize = (pageRef.current + 1) * PAGE_SIZE;
        const response = await listChatRooms({ page: 0, size: loadedSize });
        const rooms = response.chatRooms ?? response;
        const total = response.totalCount ?? rooms.length;
        setTotalCount(total);
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
      } catch (_err) {
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

  async function loadMore() {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await listChatRooms({ page: nextPage, size: PAGE_SIZE });
      const rooms = response.chatRooms ?? response;
      const myRooms = rooms.filter((room) =>
        room.members?.some((m) => m.userId === myId)
      );
      const enriched = enrichRooms(myRooms, users, myId);
      const withMessages = await attachLastMessages(enriched);
      setChatRooms((prev) => [...prev, ...withMessages]);
      setPage(nextPage);
      pageRef.current = nextPage;
    } catch (err) {
      console.error("Could not load more chat rooms", err);
    } finally {
      setLoadingMore(false);
    }
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
        {chatRooms.length < totalCount && (
          <div className="p-3">
            <Button variant="outline-secondary" className="w-100" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Henter..." : "Vis flere"}
            </Button>
          </div>
        )}
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

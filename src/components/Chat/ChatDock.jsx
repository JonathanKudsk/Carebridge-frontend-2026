import { useEffect, useRef, useState } from "react";
import { Alert, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ChatLauncher from "./ChatLauncher.jsx";
import ChatBubble from "./ChatBubble.jsx";
import ChatPopupWindow from "./ChatPopupWindow.jsx";
import ChatWindow from "./ChatWindow.jsx";
import ChatRooms from "./ChatRooms.jsx";
import NewChatPopupWindow from "./NewChatPopupWindow.jsx";
import { getUsers } from "../../api/api";
import { getCurrentUser } from "../../services/auth";
import { listChatRooms } from "../../services/chats";
import { getMessages } from "../../services/messages";

const MAX_MINIMIZED = 3;

const CHAT_RIGHT = 20;
const CHAT_LAUNCHER_BOTTOM = 20;
const CHAT_STACK_BOTTOM = 86;
const CHAT_STACK_GAP = 62;

function getRoomName(room, users, currentUserId) {
  if (room?.name) return room.name;

  const others =
    room?.members?.filter((member) => member.userId !== currentUserId) ?? [];

  const names = others
    .map((member) => users.find((user) => user.id === member.userId)?.name)
    .filter(Boolean);

  return names.length > 0 ? names.join(", ") : "Ukendt";
}

function getRoomInitial(room, users, currentUserId) {
  const name = getRoomName(room, users, currentUserId);
  return name?.trim()?.charAt(0)?.toUpperCase() || "?";
}

function enrichRoom(room, users, currentUserId) {
  return {
    ...room,
    name: getRoomName(room, users, currentUserId),
    initial: getRoomInitial(room, users, currentUserId),
  };
}

export default function ChatDock({ visible }) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [panelOpen, setPanelOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(currentUser?.id ?? null);
  const [chatRooms, setChatRooms] = useState([]);
  const [openWindows, setOpenWindows] = useState([]);
  const [minimizedWindows, setMinimizedWindows] = useState([]);
  const [notice, setNotice] = useState("");

  const noticeTimerRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setPanelOpen(false);
      setOpenWindows([]);
      setMinimizedWindows([]);
      setChatRooms([]);
      setUsers([]);
      setCurrentUserId(currentUser?.id ?? null);
      return;
    }

    let active = true;

    async function bootstrap() {
      try {
        const allUsers = await getUsers();
        if (!active) return;

        setUsers(allUsers);

        const me = allUsers.find((user) => user.email === currentUser?.email);
        const resolvedId = me?.id ?? currentUser?.id ?? null;
        if (!active) return;

        setCurrentUserId(resolvedId);
        await refreshRooms(allUsers, resolvedId);
      } catch (error) {
        console.error("Could not load chat data", error);
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [visible, currentUser?.email]);

  useEffect(() => {
    if (!visible || !currentUserId) return;

    const interval = setInterval(() => {
      refreshRooms(users, currentUserId).catch((error) => {
        console.error("Could not refresh chat rooms", error);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [visible, currentUserId, users]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  function showNotice(message) {
    setNotice(message);

    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }

    noticeTimerRef.current = setTimeout(() => {
      setNotice("");
    }, 2500);
  }

  async function attachLastMessages(rooms) {
    return Promise.all(
      rooms.map(async (room) => {
        try {
          const messages = await getMessages(room.id);
          const lastMessage = messages[messages.length - 1];
          return lastMessage ? { ...room, message: lastMessage.message } : room;
        } catch {
          return room;
        }
      })
    );
  }

  async function refreshRooms(allUsers, userId) {
    if (!userId) {
      setChatRooms([]);
      return [];
    }

    const rooms = await listChatRooms();
    const myRooms = rooms.filter((room) =>
      room.members?.some((member) => member.userId === userId)
    );

    const enriched = myRooms.map((room) => enrichRoom(room, allUsers, userId));
    const withMessages = await attachLastMessages(enriched);

    setChatRooms((prev) =>
      withMessages.map((room) => {
        const existing = prev.find((item) => item.id === room.id);
        return existing?.message ? { ...room, message: existing.message } : room;
      })
    );

    return withMessages;
  }

  function openCreateWindow() {
    setPanelOpen(false);
    setMinimizedWindows((prev) =>
      prev.filter((window) => window.id !== "create-chat")
    );
    setOpenWindows((prev) =>
      prev.some((window) => window.id === "create-chat")
        ? prev
        : [...prev, { id: "create-chat", type: "create" }]
    );
  }

  function openRoomWindow(room) {
    const windowId = `room-${room.id}`;

    setPanelOpen(false);
    setMinimizedWindows((prev) =>
      prev.filter((window) => window.id !== windowId)
    );
    setOpenWindows((prev) =>
      prev.some((window) => window.id === windowId)
        ? prev
        : [
            ...prev,
            { id: windowId, type: "room", roomId: room.id, roomSnapshot: room },
          ]
    );
  }

  function closeWindow(windowId) {
    setOpenWindows((prev) => prev.filter((window) => window.id !== windowId));
    setMinimizedWindows((prev) => prev.filter((window) => window.id !== windowId));
  }

  function minimizeWindow(windowId) {
    const window = openWindows.find((item) => item.id === windowId);
    if (!window) return;

    if (window.type === "room" && minimizedWindows.length >= MAX_MINIMIZED) {
      showNotice("Du kan kun have 3 minimerede chats.");
      return;
    }

    let label = "?";

    if (window.type === "create") {
      label = "Ny";
    } else {
      const room =
        window.roomSnapshot || chatRooms.find((r) => r.id === window.roomId);

      if (room) {
        label = getRoomInitial(room, users, currentUserId);
      }
    }

    setOpenWindows((prev) => prev.filter((item) => item.id !== windowId));
    setMinimizedWindows((prev) =>
      prev.some((item) => item.id === windowId)
        ? prev
        : [...prev, { ...window, label }]
    );
  }

  function restoreWindow(windowId) {
    const window = minimizedWindows.find((item) => item.id === windowId);
    if (!window) return;

    setMinimizedWindows((prev) => prev.filter((item) => item.id !== windowId));
    setOpenWindows((prev) =>
      prev.some((item) => item.id === windowId)
        ? prev
        : [
            ...prev,
            window.type === "create"
              ? { id: "create-chat", type: "create" }
              : {
                  id: window.id,
                  type: "room",
                  roomId: window.roomId,
                  roomSnapshot: window.roomSnapshot,
                },
          ]
    );
  }

  function routeWindow(window) {
    if (window.type === "create") {
      navigate("/message-page");
    } else {
      navigate(`/message-page?chatRoomId=${window.roomId}`);
    }

    closeWindow(window.id);
    setPanelOpen(false);
  }

  function handleStartChat(chatRoom) {
    const enriched = enrichRoom(chatRoom, users, currentUserId);

    setChatRooms((prev) =>
      prev.some((room) => room.id === enriched.id)
        ? prev.map((room) =>
            room.id === enriched.id ? { ...room, ...enriched } : room
          )
        : [enriched, ...prev]
    );

    openRoomWindow(enriched);
  }

  if (!visible) return null;

  return (
    <>
      <ChatLauncher
        onClick={() => setPanelOpen((prev) => !prev)}
        active={panelOpen}
      />

      {panelOpen && (
        <div
          className="position-fixed"
          style={{
            right: CHAT_RIGHT,
            bottom: CHAT_STACK_BOTTOM,
            zIndex: 1200,
            width: 380,
          }}
        >
          <ChatPopupWindow
            title="Beskeder"
            subtitle="Start en ny chat eller vælg en eksisterende"
            onClose={() => setPanelOpen(false)}
            onMinimize={() => setPanelOpen(false)}
            onRoute={() => navigate("/message-page")}
            width={380}
            height={520}
          >
            <div className="d-flex flex-column h-100" style={{ minHeight: 0 }}>
              <div className="p-3 border-bottom">
                <Button className="w-100" onClick={openCreateWindow}>
                  Ny Chat
                </Button>
              </div>

              <div className="flex-grow-1 overflow-auto">
                {chatRooms.length === 0 ? (
                  <div className="p-3 text-muted">Ingen chats endnu.</div>
                ) : (
                  <ChatRooms
                    chatRooms={chatRooms}
                    activeChatRoomId={null}
                    onSelectRoom={openRoomWindow}
                  />
                )}
              </div>
            </div>
          </ChatPopupWindow>
        </div>
      )}

      {notice && (
        <div
          className="position-fixed"
          style={{
            right: CHAT_RIGHT,
            bottom: CHAT_STACK_BOTTOM + 60,
            zIndex: 1300,
            width: 320,
          }}
        >
          <Alert variant="warning" className="mb-0 py-2">
            {notice}
          </Alert>
        </div>
      )}

      <div
        className="position-fixed"
        style={{
          right: CHAT_RIGHT,
          bottom: CHAT_STACK_BOTTOM,
          zIndex: 1100,
          width: 380,
          maxHeight: "calc(100vh - 160px)",
          overflowY: "auto",
          overflowX: "visible",
          pointerEvents: "none",
        }}
      >
        <div className="d-flex flex-column gap-2 align-items-end pe-1">
          {openWindows.map((window) => {
            const room =
              window.type === "room"
                ? chatRooms.find((item) => item.id === window.roomId) ??
                  window.roomSnapshot
                : null;

            return (
              <div key={window.id} style={{ pointerEvents: "auto" }}>
                {window.type === "create" ? (
                  <NewChatPopupWindow
                    onClose={() => closeWindow(window.id)}
                    onMinimize={() => minimizeWindow(window.id)}
                    onRoute={() => routeWindow(window)}
                    onStartChat={handleStartChat}
                  />
                ) : (
                  <ChatPopupWindow
                    title={room?.name || "Ukendt"}
                    subtitle={room?.message || "Ingen beskeder endnu"}
                    onClose={() => closeWindow(window.id)}
                    onMinimize={() => minimizeWindow(window.id)}
                    onRoute={() => routeWindow(window)}
                    width={380}
                    height={520}
                  >
                    <div
                      className="d-flex flex-column h-100"
                      style={{ minHeight: 0 }}
                    >
                      {room ? (
                        <ChatWindow
                          chatRoom={room}
                          users={users}
                          onLastMessage={(roomId, text) =>
                            setChatRooms((prev) =>
                              prev.map((item) =>
                                item.id === roomId ? { ...item, message: text } : item
                              )
                            )
                          }
                        />
                      ) : (
                        <div className="p-3 text-muted">
                          Chatten kunne ikke findes.
                        </div>
                      )}
                    </div>
                  </ChatPopupWindow>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="position-fixed"
        style={{
          right: CHAT_RIGHT,
          bottom: CHAT_LAUNCHER_BOTTOM,
          zIndex: 2000,
        }}
      >
        {minimizedWindows.map((window, index) => (
          <div
            key={window.id}
            className="position-fixed"
            style={{
              right: CHAT_RIGHT,
              bottom: CHAT_STACK_BOTTOM + index * CHAT_STACK_GAP,
              zIndex: 2100 + index,
            }}
          >
            <ChatBubble
              label={window.label}
              title={window.type === "create" ? "Ny Chat" : "Gendan chat"}
              onClick={() => restoreWindow(window.id)}
              onClose={() => closeWindow(window.id)}
            />
          </div>
        ))}
      </div>
    </>
  );
}
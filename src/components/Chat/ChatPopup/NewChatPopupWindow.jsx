import { useEffect, useState } from "react";
import { Button, ListGroup, Alert } from "react-bootstrap";
import { getUsers } from "../../../api/api.js";
import { createChat } from "../../../services/chats.js";
import { getCurrentUser } from "../../../services/auth.js";
import ChatPopupWindow from "./ChatPopupWindow.jsx";

const EMPLOYEE_ROLES = new Set(["ADMIN", "CAREWORKER", "PLANNER"]);

export default function NewChatPopupWindow({
  onClose,
  onMinimize,
  onRoute,
  onStartChat,
}) {
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        const allUsers = await getUsers();
        if (!active) return;

        const currentUser = getCurrentUser();
        const me = allUsers.find((user) => user.email === currentUser?.email);
        const resolvedId = me?.id ?? currentUser?.id ?? null;

        setCurrentUserId(resolvedId);
        setUsers(
          allUsers.filter(
            (user) => EMPLOYEE_ROLES.has(user.role) && user.id !== resolvedId
          )
        );
      } catch (err) {
        console.error("Could not fetch users", err);
        if (active) setError("Kunne ikke hente medarbejdere.");
      }
    }

    loadUsers();

    return () => {
      active = false;
    };
  }, []);

  function toggleUser(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleStartChat() {
    if (!currentUserId || selectedIds.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const members = [
        { userId: currentUserId },
        ...selectedIds.map((id) => ({ userId: id })),
      ];

      const chatRoom = await createChat({ members });
      onStartChat?.(chatRoom);
      onClose?.();
    } catch (err) {
      console.error("Could not create chat room", err);
      setError("Kunne ikke oprette chatten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ChatPopupWindow
      title="Ny Chat"
      subtitle="Vælg en eller flere medarbejdere"
      onClose={onClose}
      onMinimize={onMinimize}
      onRoute={onRoute}
      width={380}
      height={520}
    >
      <div className="d-flex flex-column h-100" style={{ minHeight: 0 }}>
        <div className="flex-grow-1 overflow-auto p-3">
          {error && <Alert variant="danger">{error}</Alert>}

          {users.length === 0 ? (
            <div className="text-muted">Ingen medarbejdere fundet.</div>
          ) : (
            <ListGroup>
              {users.map((user) => (
                <ListGroup.Item
                  key={user.id}
                  action
                  active={selectedIds.includes(user.id)}
                  onClick={() => toggleUser(user.id)}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div className="fw-semibold">{user.name}</div>
                    <div className="small text-muted">{user.role}</div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>

        <div className="border-top p-3">
          <Button
            className="w-100"
            variant="primary"
            disabled={selectedIds.length === 0 || loading}
            onClick={handleStartChat}
          >
            {loading ? "Opretter..." : "Start Chat"}
          </Button>
        </div>
      </div>
    </ChatPopupWindow>
  );
}
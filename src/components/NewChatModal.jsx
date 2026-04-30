import { Modal, ListGroup, Button } from "react-bootstrap";
import { useEffect, useState } from "react";
import { getUsers } from "../api/api";
import { createChat } from "../services/chats";
import { getCurrentUser } from "../services/auth";

export default function NewChatModal({ show, onHide, onStartChat }) {
  const [careworkers, setCareworkers] = useState([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const users = await getUsers();
        const currentUser = getCurrentUser();
        // Look up the real DB id by email in case the login response omitted it
        const me = users.find((u) => u.email === currentUser?.email);
        setCurrentUserId(me?.id ?? currentUser?.id);
        const filteredCareWorkers = users.filter(
          (user) =>
            (user.role === "CAREWORKER" || user.role === "ADMIN") &&
            user.id !== (me?.id ?? currentUser?.id),
        );
        setCareworkers(filteredCareWorkers);
      } catch (error) {
        console.log("Could not fetch users", error);
      }
    }
    if (show) {
      loadUsers();
      setSelectedWorkerIds([]);
    }
  }, [show]);

  function toggleWorker(id) {
    setSelectedWorkerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleStartChat() {
    if (selectedWorkerIds.length === 0 || !currentUserId) return;
    setLoading(true);
    try {
      const members = [{ userId: currentUserId }, ...selectedWorkerIds.map((id) => ({ userId: id }))];
      const chatRoom = await createChat({ members });
      onStartChat?.(chatRoom);
      onHide();
    } catch (err) {
      console.error("Could not create chat room", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
      <Modal.Title>Opret en chat med:</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <ListGroup>
          {careworkers.map((worker) => (
            <ListGroup.Item
              key={worker.id}
              action
              active={selectedWorkerIds.includes(worker.id)}
              onClick={() => toggleWorker(worker.id)}
            >
              {worker.name}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="primary"
          disabled={selectedWorkerIds.length === 0 || loading}
          onClick={handleStartChat}
        >
          {loading ? "Opretter..." : "Start Chat"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

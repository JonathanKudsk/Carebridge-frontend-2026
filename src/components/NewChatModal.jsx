import { Modal, ListGroup, Button } from "react-bootstrap";
import { useEffect, useState } from "react";
import { getUsers } from "../api/api";

export default function NewChatModal({ show, onHide }) {
  const [careworkers, setCareworkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  useEffect(() => {
    async function loadUsers() {
      try {
        const users = await getUsers();
        const filteredCareWorkers = users.filter(
          (user) => user.role === "CAREWORKER" || user.role === "ADMIN",
        );
        setCareworkers(filteredCareWorkers);
      } catch (error) {
        console.log("Could not fetch users", error);
      }
    }
    loadUsers();
  }, []);

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Vælg en medarbejder for at starte en chat</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <ListGroup>
          {careworkers.map((worker) => (
            <ListGroup.Item
              key={worker.id}
              action
              active={selectedWorkerId === worker.id}
              onClick={() => setSelectedWorkerId(worker.id)}
            >
              {worker.name}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="primary" disabled={!selectedWorkerId}>
          Start Chat
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

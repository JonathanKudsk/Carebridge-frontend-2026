import { useState } from "react";
import { Button } from "react-bootstrap";
import NewChatModal from "../../components/NewChatModal";

export default function MessagePage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <Button onClick={() => setShowModal(true)}>Ny Chat</Button>

      <NewChatModal show={showModal} onHide={() => setShowModal(false)} />
    </div>
  );
}

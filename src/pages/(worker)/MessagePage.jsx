import { useState } from "react";
import { Button } from "react-bootstrap";
import NewChatModal from "../../components/NewChatModal";

export default function MessagePage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="d-flex" style={{ height: "100vh" }}>

      {/* Left */}
      <div className="border-end overflow-auto" style={{ width: 300 }}>
        <div className="p-3">
          <Button className="w-100" onClick={() => setShowModal(true)}>Ny Chat</Button>
        </div>
      </div>

      {/* Right */}
      <div className="flex-grow-1 d-flex flex-column">
      </div>

      <NewChatModal show={showModal} onHide={() => setShowModal(false)} />
    </div>
  );
}

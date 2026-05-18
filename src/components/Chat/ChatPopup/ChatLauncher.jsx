import { Button } from "react-bootstrap";

const CHAT_RIGHT = 20;
const CHAT_LAUNCHER_BOTTOM = 20;

export default function ChatLauncher({ onClick, active = false }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      aria-label="Beskeder"
      variant={active ? "secondary" : "primary"}
      className="position-fixed rounded-circle shadow d-flex align-items-center justify-content-center p-0"
      style={{
        width: 58,
        height: 58,
        right: CHAT_RIGHT,
        bottom: CHAT_LAUNCHER_BOTTOM,
        zIndex: 1090,
      }}
    >
      <span className="fw-bold" style={{ fontSize: "1.35rem", lineHeight: 1 }}>
        B
      </span>
    </Button>
  );
}
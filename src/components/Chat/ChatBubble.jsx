import { useState } from "react";
import { Button } from "react-bootstrap";

export default function ChatBubble({ label = "?", title, onClick, onClose }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      title={title}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-circle shadow d-flex align-items-center justify-content-center text-white fw-bold position-relative"
      style={{
        width: 56,
        height: 56,
        cursor: "pointer",
        background: "var(--bs-primary)",
        userSelect: "none",
      }}
    >
      <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{label}</span>

      <Button
        type="button"
        size="sm"
        variant="light"
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
        className="position-absolute rounded-circle p-0 border-0"
        style={{
          width: 18,
          height: 18,
          lineHeight: 1,
          top: -4,
          right: -4,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.15s ease",
        }}
        aria-label="Luk"
        title="Luk"
      >
        ×
      </Button>
    </div>
  );
}
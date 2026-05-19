import { Card, Button } from "react-bootstrap";

export default function ChatPopupWindow({
  title,
  subtitle,
  onClose,
  onMinimize,
  onRoute,
  width = 360,
  height = 520,
  children,
}) {
  return (
    <Card
      className="shadow border-0 overflow-hidden"
      style={{
        width,
        height,
        backgroundColor: "var(--bs-body-bg)",
      }}
    >
      <Card.Header className="bg-dark text-white d-flex align-items-start justify-content-between gap-2 py-2 px-3">
        <div style={{ minWidth: 0 }}>
          <div className="fw-semibold text-truncate">{title}</div>
          {subtitle && (
            <div className="small text-white-50 text-truncate">{subtitle}</div>
          )}
        </div>

        <div className="d-flex gap-1 flex-shrink-0">
          <Button
            type="button"
            size="sm"
            variant="outline-light"
            className="px-2 py-0"
            onClick={onRoute}
            title="Gå til beskeder"
            aria-label="Gå til beskeder"
          >
            ↗
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline-light"
            className="px-2 py-0"
            onClick={onMinimize}
            title="Minimér"
            aria-label="Minimér"
          >
            −
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline-light"
            className="px-2 py-0"
            onClick={onClose}
            title="Luk"
            aria-label="Luk"
          >
            ×
          </Button>
        </div>
      </Card.Header>

      <Card.Body className="p-0 d-flex flex-column overflow-hidden">
        {children}
      </Card.Body>
    </Card>
  );
}
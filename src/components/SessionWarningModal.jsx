import { useEffect, useState } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { refresh } from "../services/auth";
import { getSessionTimes } from "../services/auth";

export default function SessionWarningModal({ show, onRefreshed, onExpired }) {
  const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    if (!show) {
      setSecondsLeft(30);
      return;
    }

    const { expiresAt } = getSessionTimes();
    if (!expiresAt) return;

    const tick = setInterval(() => {
      const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
    }, 500);

    return () => clearInterval(tick);
  }, [show]);

  async function handleConfirm() {
    setBusy(true);
    try {
      await refresh();
      onRefreshed();
    } catch {
      onExpired();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal show={show} backdrop="static" keyboard={false} centered>
      <Modal.Header>
        <Modal.Title>Session udløber snart</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-1">Din session udløber om <strong>{secondsLeft}</strong> sekunder.</p>
        <p className="mb-0">Vil du fortsætte?</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleConfirm} disabled={busy}>
          {busy ? <><Spinner size="sm" className="me-2" />Fornyer…</> : "Ja, fortsæt"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

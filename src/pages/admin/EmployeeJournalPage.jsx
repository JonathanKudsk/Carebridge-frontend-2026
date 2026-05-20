import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  ListGroup,
  Spinner,
} from "react-bootstrap";
import { useParams } from "react-router-dom";
import {
  createStaffJournalEntry,
  deleteContract,
  deleteStaffJournalEntry,
  downloadContract,
  getStaffJournalByUserId,
  updateStaffJournalEntry,
  uploadContract,
} from "../../api/api";

export default function EmployeeJournalPage() {
  const { userId } = useParams();
  const [journal, setJournal] = useState(null);
  const [entries, setEntries] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [contractFile, setContractFile] = useState(null);
  const [contractUploading, setContractUploading] = useState(false);
  const [contractMsg, setContractMsg] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getStaffJournalByUserId(userId)
      .then((data) => {
        setJournal(data);
        setEntries(data.entries || []);
        setContracts(data.contracts || []);
      })
      .catch(() => setError("Kunne ikke hente medarbejderjournal"))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleCreateEntry(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      const created = await createStaffJournalEntry(journal.id, {
        title: newTitle,
        content: newContent,
      });
      setEntries([created, ...entries]);
      setNewTitle("");
      setNewContent("");
    } catch {
      alert("Kunne ikke oprette journalnotat");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setEditTitle(entry.title);
    setEditContent(entry.content || "");
  }

  async function handleUpdateEntry(e, entryId) {
    e.preventDefault();
    try {
      const updated = await updateStaffJournalEntry(journal.id, entryId, {
        title: editTitle,
        content: editContent,
      });
      setEntries(entries.map((en) => (en.id === entryId ? updated : en)));
      setEditingId(null);
    } catch {
      alert("Kunne ikke opdatere journalnotat");
    }
  }

  async function handleDeleteEntry(entryId) {
    if (!window.confirm("Slet dette journalnotat?")) return;
    try {
      await deleteStaffJournalEntry(journal.id, entryId);
      setEntries(entries.filter((en) => en.id !== entryId));
    } catch {
      alert("Kunne ikke slette journalnotat");
    }
  }

  async function handleUploadContract(e) {
    e.preventDefault();
    if (!contractFile) return;
    setContractUploading(true);
    setContractMsg(null);
    try {
      const created = await uploadContract(journal.id, contractFile);
      setContracts([created, ...contracts]);
      setContractMsg({ type: "success", text: "Kontrakt uploadet" });
      setContractFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setContractMsg({ type: "danger", text: "Upload mislykkedes" });
    } finally {
      setContractUploading(false);
    }
  }

  async function handleDownloadContract(contractId) {
    try {
      await downloadContract(journal.id, contractId);
    } catch {
      alert("Kunne ikke hente kontrakt");
    }
  }

  async function handleDeleteContract(contractId) {
    if (!window.confirm("Slet denne kontrakt?")) return;
    try {
      await deleteContract(journal.id, contractId);
      setContracts(contracts.filter((c) => c.id !== contractId));
    } catch {
      alert("Kunne ikke slette kontrakt");
    }
  }

  if (loading) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>
      <h2 className="mb-4">Medarbejderjournal</h2>

      {/* Contract section */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Card.Title>Kontrakter</Card.Title>
          <Form onSubmit={handleUploadContract} className="d-flex align-items-center gap-2 mb-3">
            <Form.Control
              type="file"
              accept=".pdf"
              ref={fileInputRef}
              onChange={(e) => setContractFile(e.target.files[0])}
            />
            <Button type="submit" variant="secondary" disabled={!contractFile || contractUploading}>
              {contractUploading ? "Uploader..." : "Upload PDF"}
            </Button>
          </Form>
          {contractMsg && (
            <Alert variant={contractMsg.type} className="mb-2 py-1">
              {contractMsg.text}
            </Alert>
          )}
          {contracts.length === 0 ? (
            <p className="text-muted mb-0">Ingen kontrakter uploadet endnu.</p>
          ) : (
            <ListGroup variant="flush">
              {contracts.map((c) => (
                <ListGroup.Item key={c.id} className="d-flex justify-content-between align-items-center px-0">
                  <div>
                    <span className="fw-semibold">{c.filename}</span>
                    {c.uploadedAt && (
                      <span className="text-muted ms-2" style={{ fontSize: "0.85rem" }}>
                        {new Date(c.uploadedAt).toLocaleDateString("da-DK")}
                      </span>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-primary" onClick={() => handleDownloadContract(c.id)}>
                      Download
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDeleteContract(c.id)}>
                      Slet
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      {/* New entry form */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Card.Title>Tilføj journalnotat</Card.Title>
          <Form onSubmit={handleCreateEntry}>
            <Form.Group className="mb-2">
              <Form.Control
                placeholder="Titel (f.eks. MUS-samtale 2025)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Indhold..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
            </Form.Group>
            <Button type="submit" disabled={submitting || !newTitle.trim()}>
              {submitting ? "Opretter..." : "Opret notat"}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Entries list */}
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title>Journalnotater</Card.Title>
          {entries.length === 0 ? (
            <p className="text-muted">Ingen notater endnu.</p>
          ) : (
            <ListGroup variant="flush">
              {entries.map((entry) =>
                editingId === entry.id ? (
                  <ListGroup.Item key={entry.id}>
                    <Form onSubmit={(e) => handleUpdateEntry(e, entry.id)}>
                      <Form.Control
                        className="mb-2"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                      />
                      <Form.Control
                        as="textarea"
                        rows={3}
                        className="mb-2"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <Button type="submit" size="sm" variant="success" className="me-2">
                        Gem
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => setEditingId(null)}
                      >
                        Annuller
                      </Button>
                    </Form>
                  </ListGroup.Item>
                ) : (
                  <ListGroup.Item key={entry.id} className="d-flex justify-content-between align-items-start">
                    <div style={{ maxWidth: "75%" }}>
                      <strong>{entry.title}</strong>
                      <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                        {entry.createdAt
                          ? new Date(entry.createdAt).toLocaleDateString("da-DK")
                          : ""}
                        {entry.authorName ? ` · ${entry.authorName}` : ""}
                      </div>
                      {entry.content && <p className="mb-0 mt-1">{entry.content}</p>}
                    </div>
                    <div className="d-flex gap-2 ms-2">
                      <Button size="sm" variant="outline-primary" onClick={() => startEdit(entry)}>
                        Rediger
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        Slet
                      </Button>
                    </div>
                  </ListGroup.Item>
                )
              )}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </>
  );
}

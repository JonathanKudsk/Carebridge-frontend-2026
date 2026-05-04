import { useState } from "react";
import { Form, Button, Row, Col, Alert, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { createJournalEntry } from "../../api/api";
import { validateJournal } from "../../utils/validation";

export default function JournalForm({ initialData, addJournal, journalId, residentId }) {
  const navigate = useNavigate();

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const [formData, setFormData] = useState(
    initialData || {
      author: storedUser?.id || "",      // <‑‑ author = logged‑in user id
      title: "",
      type: "",
      content: "",
      riskAssessment: "",
    }
  );
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");

    const validationErrors = validateJournal(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setStatus("error");
      return;
    }

    if (!journalId) {
      console.error("Mangler journalId — kan ikke oprette journal entry.");
      setStatus("error");
      return;
    }

    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        entryType: formData.type,
        riskAssessment: formData.riskAssessment,
        authorUserId: Number(formData.author || storedUser?.id),
      };

      const newEntry = await createJournalEntry(journalId, payload);

      if (addJournal) {
        addJournal((prev) => [...prev, newEntry]);
      }

      setStatus("success");
      navigate(`/residents/${residentId}`);
    } catch (err) {
      console.error("Journal oprettelse fejlede:", err.response?.data || err);
      setStatus("error");
    }
  }

  return (
    <Card className="p-4 shadow-sm mx-auto" style={{ maxWidth: "700px" }}>
      <Card.Body>
        <Card.Title>
          {initialData ? "Rediger journalindgang" : "Opret journalindgang"}
        </Card.Title>

        {status === "success" && <Alert variant="success">Journal gemt!</Alert>}
        {status === "error" && <Alert variant="danger">Der opstod en fejl.</Alert>}

        <Form onSubmit={handleSubmit}>
          {/* Titel */}
          <Form.Group className="mb-3">
            <Form.Label>Titel</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
            />
            {errors.title && (
              <Form.Text className="text-danger">{errors.title}</Form.Text>
            )}
          </Form.Group>

          {/* Forfatter – vist men ikke redigerbar */}
          <Form.Group className="mb-3">
            <Form.Label>Forfatter</Form.Label>
            <Form.Control
              type="text"
              value={storedUser?.name || storedUser?.email || "Ukendt bruger"}
              disabled
              readOnly
            />
          </Form.Group>

          {/* Type */}
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Type</Form.Label>
                <Form.Select name="type" value={formData.type} onChange={handleChange}>
                  <option value="">Vælg type</option>
                  <option value="DAILY">Daily</option>
                  <option value="NOTE">Note</option>
                  <option value="MEDICAL">Medical</option>
                  <option value="INCIDENT">Incident</option>
                </Form.Select>
                {errors.type && <Form.Text className="text-danger">{errors.type}</Form.Text>}
              </Form.Group>
            </Col>
          </Row>

          {/* Indhold */}
          <Form.Group className="mb-3">
            <Form.Label>Indhold</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="content"
              value={formData.content}
              onChange={handleChange}
            />
            {errors.content && <Form.Text className="text-danger">{errors.content}</Form.Text>}
          </Form.Group>

          {/* Risikoniveau */}
          <Form.Group className="mb-3">
            <Form.Label>Risikoniveau</Form.Label>
            <Form.Select
              name="riskAssessment"
              value={formData.riskAssessment}
              onChange={handleChange}
            >
              <option value="">Vælg niveau</option>
              <option value="LOW">Lav</option>
              <option value="MEDIUM">Middel</option>
              <option value="HIGH">Høj</option>
            </Form.Select>
            {errors.riskAssessment && <Form.Text className="text-danger">{errors.riskAssessment}</Form.Text>}
          </Form.Group>

          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Gemmer..." : "Gem"}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

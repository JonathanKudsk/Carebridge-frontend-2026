import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Button, Row, Col, Card } from "react-bootstrap";
import api from "../../services/api";
import { createJournalEntry } from "../../api/api";

export default function JournalForm({
  initialData,
  addJournal,
  journalId,
  residentId,
}) {
  const { journalId: routeJournalId } = useParams();
  const navigate = useNavigate();

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const resolvedJournalId = journalId || routeJournalId || initialData?.journalId || "";

  const [formData, setFormData] = useState(
    initialData || {
      author: storedUser?.id || "",
      journalId: resolvedJournalId,
      title: "",
      templateId: "",
      entryType: "NOTE",
      answers: "",
      riskAssessment: "",
    }
  );
  const [templateFields, setTemplateFields] = useState([]);
  const [answers, setAnswers] = useState({});
  const [availableTemplates, setAvailableTemplates] = useState([]);

  function normalizeTemplateList(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    if (Array.isArray(payload?.templates)) {
      return payload.templates;
    }

    if (Array.isArray(payload?.content)) {
      return payload.content;
    }

    return [];
  }

  function getTemplateValue(template, index) {
    return template?.id ?? template?.templateId ?? template?.templateID ?? index;
  }

  function getTemplateLabel(template, index) {
    return (
      template?.name ??
      template?.title ??
      template?.templateName ??
      template?.label ??
      `Template ${index + 1}`
    );
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  const getAllTemplates = useCallback(() => {
    api
      .get("/templates")
      .then((response) => {
        const templates = normalizeTemplateList(response.data);
        setAvailableTemplates(templates);
      })
      .catch((error) => {
        console.error("Error fetching templates:", error);
        setAvailableTemplates([]);
      });
  }, []);

  useEffect(() => {
    getAllTemplates();
  }, [getAllTemplates]);

  const getIndividualTemplateInfo = useCallback((templateId) => {
    api
      .get("/templates/" + templateId)
      .then((response) => {
        setTemplateFields(extractTemplateFields(response.data));
      })
      .catch((error) => {
        console.error("Error fetching template info:", error);
        setTemplateFields([]);
      });
  }, []);

  useEffect(() => {
    if (!formData.templateId) {
      setTemplateFields([]);
      return;
    }

    getIndividualTemplateInfo(formData.templateId);
  }, [formData.templateId, getIndividualTemplateInfo]);

  function extractTemplateFields(templateData) {
    if (!Array.isArray(templateData?.fields)) {
      return [];
    }

    return templateData.fields
      .map((field, index) => ({
        id: field.id ?? field.fieldId ?? field.fieldID ?? index,
        title: field.title,
        fieldType: field.fieldType,
      }))
      .filter((field) => typeof field.fieldType === "string");
  }

  function fieldTypeToInputField(fields) {
    if (!Array.isArray(fields)) {
      return null;
    }

    return fields.map((field, index) => {
      function updateAnswer(value) {
        setAnswers((prev) => ({
          ...prev,
          [field.id]: value,
        }));
      }

      switch (field.fieldType) {
        case "TEXTFIELD":
          return (
            <Form.Group className="mb-3" key={`text-${field.id ?? index}`}>
              <Form.Label>{field.title || "Tekstfelt"}</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter text"
                required
                onChange={(e) => updateAnswer(e.target.value)}
              />
            </Form.Group>
          );
        case "CHECKBOX":
          return (
            <Form.Group className="mb-3" key={`checkbox-${field.id ?? index}`}>
              <Form.Check
                type="checkbox"
                label={field.title}
                onChange={(e) => updateAnswer(e.target.checked)}
              />
            </Form.Group>
          );
        case "NUMBERFIELD":
          return (
            <Form.Group className="mb-3" key={`number-${field.id ?? index}`}>
              <Form.Label>{field.title || "Talfelt"}</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter number"
                required
                onChange={(e) => updateAnswer(e.target.value)}
              />
            </Form.Group>
          );
        default:
          return null;
      }
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const selectedJournalId = Number(
      formData.journalId || journalId || routeJournalId || initialData?.journalId
    );

    if (!Number.isInteger(selectedJournalId) || selectedJournalId <= 0) {
      console.error("Missing journalId for journal entry submit");
      return;
    }

    const payload = {
      title: formData.title?.trim() || "",
      entryType: formData.entryType || "NOTE",
      riskAssessment: formData.riskAssessment || "",
      templateId: Number(formData.templateId),
      answers: templateFields.map((field) => ({
        fieldId: field.id,
        answer: answers[field.id] ?? "",
      })),
    };

    try {
      const data = await createJournalEntry(selectedJournalId, payload);
      if (typeof addJournal === "function") {
        addJournal((prev) => [...prev, data]);
      }

      if (residentId) {
        navigate(`/residents/${residentId}`);
      } else {
        navigate("/journal-overview");
      }
    } catch (error) {
      console.error("Error creating journal entry:", error);
      alert("Failed to create journal entry. Please try again.");
    }
  }

  return (
    <Card className="p-4 shadow-sm mx-auto" style={{ maxWidth: "700px" }}>
      <Card.Body>
        <Card.Title>
          {initialData ? "Rediger journalindgang" : "Opret journalindgang"}
        </Card.Title>

        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Journal ID</Form.Label>
                <Form.Control
                  type="number"
                  name="journalId"
                  value={formData.journalId}
                  onChange={handleChange}
                  placeholder="Indtast journalens ID"
                  min="1"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Titel</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Skriv en titel"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Skabelon Type</Form.Label>
                <Form.Select
                  name="templateId"
                  value={formData.templateId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Vælg Type</option>
                  {availableTemplates.map((template, index) => {
                    const templateValue = getTemplateValue(template, index);

                    return (
                      <option key={templateValue} value={templateValue}>
                        {getTemplateLabel(template, index)}
                      </option>
                    );
                  })}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Entry Type</Form.Label>
            <Form.Select
              name="entryType"
              value={formData.entryType}
              onChange={handleChange}
              required
            >
              <option value="DAILY">DAILY</option>
              <option value="NOTE">NOTE</option>
              <option value="MEDICAL">MEDICAL</option>
              <option value="INCIDENT">INCIDENT</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Risikoniveau</Form.Label>
            <Form.Select
              name="riskAssessment"
              value={formData.riskAssessment}
              onChange={handleChange}
              required
            >
              <option value="">Vælg risikoeniveau</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </Form.Select>
          </Form.Group>

          {fieldTypeToInputField(templateFields)}

          <Button type="submit">Gem</Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { Form, Button, Row, Col, Alert, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { createJournalEntry } from "../../api/api";
import api from "../../services/api";
import { validateJournal } from "../../utils/validation";

export default function JournalForm({ initialData, addJournal }) {
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
  const [fieldTypes, setFieldTypes] = useState([]);
  const [answers, setAnswers] = useState([]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  //Function to get the information about a template from API.
  function getTemplateInfo(templateId) {
    api
      .get("/templates/" + templateId)
      .then((data) => {
        setFieldTypes(extractFieldTypes(data.data));
      })
      .catch((error) => {
        console.error("Error fetching template info:", error);
        setFieldTypes([]);
      });
  }

  useEffect(() => {
    if (!formData.type) {
      setFieldTypes([]);
      return;
    }

    getTemplateInfo(formData.type);
  }, [formData.type]);


  //Make a list of field types from the database
  function extractFieldTypes(templateData) {
    if (!Array.isArray(templateData?.fields)) {
      return [];
    }

    return templateData.fields
      .map((field) => field.fieldType)
      .filter((fieldType) => typeof fieldType === "string");
  }

  //Return the correct input field based on the field type
  function fieldTypeToInputField(fieldType) {
    if (!Array.isArray(fieldType)) {
      return null;
    }

    return fieldType.map((element, index) => {
      function updateAnswerAtIndex(value) {
        setAnswers((prev) => {
          const nextAnswers = [...prev];
          nextAnswers[index] = value;
          return nextAnswers;
        });
      }

      switch (element) {
        case "TEXTFIELD":
          return (
            <Form.Group className="mb-3" key={`text-${index}`}>
              <Form.Label>Tekstfelt</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter text"
                onChange={(e) => updateAnswerAtIndex(e.target.value)}
              />
            </Form.Group>
          );
        case "CHECKBOX":
          return (
            <Form.Group className="mb-3" key={`checkbox-${index}`}>
              <Form.Check
                type="checkbox"
                label="Check me out"
                onChange={(e) => updateAnswerAtIndex(e.target.checked)}
              />
            </Form.Group>
          );
        case "NUMBERFIELD":
          return (
            <Form.Group className="mb-3" key={`number-${index}`}>
              <Form.Label>Talfelt</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter number"
                onChange={(e) => updateAnswerAtIndex(e.target.value)}
              />
            </Form.Group>
          );
        default:
          return null;
      }
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    console.log("Current answers:", answers);
    // When we have a api call to save the answers to the database add it in here
  }

  return (
    <Card className="p-4 shadow-sm mx-auto" style={{ maxWidth: "700px" }}>
      <Card.Body>
        <Card.Title>
          {initialData ? "Rediger journalindgang" : "Opret journalindgang"}
        </Card.Title>

        {status === "success" && <Alert variant="success">Journal gemt!</Alert>}
        {status === "error" && <Alert variant="danger">Der opstod en fejl.</Alert>}

        <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Type</Form.Label>
                <Form.Select name="type" value={formData.type} onChange={handleChange}>
                  <option value="">Vælg type</option>
                  <option value="1">Template 1</option>
                  <option value="2">Template 2</option>
                  <option value="3">Template 3</option>
                  <option value="4">Template 4</option>
                </Form.Select>
                {errors.type && <Form.Text className="text-danger">{errors.type}</Form.Text>}
              </Form.Group>
            </Col>
          </Row>

          <Form onSubmit={handleSubmit}>
          {fieldTypeToInputField(fieldTypes)}

          <Button type="submit">
            Gem
          </Button>
          </Form>

      </Card.Body>
    </Card>
  );
}

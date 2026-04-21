import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Spinner, Alert } from "react-bootstrap";
import { getResidentById, updateResident } from "../api/api.js";

export default function EditResidentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    cprNr: ""
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  
  useEffect(() => {
    const fetchResident = async () => {
      try {
        const data = await getResidentById(id);
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          cprNr: data.cprNr || ""
        });
      } catch (err) {
        setError("Kunne ikke hente beboerens data.");
      } finally {
        setLoading(false);
      }
    };
    fetchResident();
  }, [id]);

  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateResident(id, formData);
      

      navigate(`/residents/${id}`);
    } catch (err) {
      setError("Fejl ved opdatering af beboer.");
      setIsSaving(false);
    }
  };

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" /></Container>;

  return (
    <Container className="mt-4">
      <Card className="shadow-sm mx-auto" style={{ maxWidth: "600px" }}>
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">Edit Resident</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>CPR Number</Form.Label>
              <Form.Control
                type="text"
                name="cprNr"
                value={formData.cprNr}
                onChange={handleChange}
                placeholder="123456-7890"
              />
            </Form.Group>

            <div className="d-flex gap-2 justify-content-end">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate(-1)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
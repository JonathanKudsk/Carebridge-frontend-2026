import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Button, Stack, Spinner, Alert } from "react-bootstrap";
import { getResidentById, deleteResident } from "../api/api.js";

export default function ResidentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCpr, setShowCpr] = useState(false);

  useEffect(() => {
    fetchResident();
  }, [id]);

  const fetchResident = async () => {
    try {
      setLoading(true);
      const data = await getResidentById(id);
      setResident(data);
      setError(null);
    } catch (err) {
      setError("Kunne ikke hente beboerdata. Prøv igen senere.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Er du sikker på, at du vil slette ${resident.firstName}?`)) {
      try {
        await deleteResident(id);
        navigate("/resident-overview"); 
      } catch (err) {
        console.error(err);
        setError("Noget gik galt");
      }
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={() => navigate("/resident-overview")}>Tilbage til oversigt</Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Button 
        variant="link" 
        onClick={() => navigate("/resident-overview")} 
        className="mb-3 p-0 text-decoration-none"
      >
        &larr; Tilbage til oversigt
      </Button>

      <Card className="shadow-sm">
        <Card.Header as="h5" className="bg-primary text-white">
          Resident Profil
        </Card.Header>
        <Card.Body>
          <div className="mb-4">
            <h2 className="mb-1">{resident.firstName} {resident.lastName}</h2>
            <p className="text-muted">ID: {resident.id}</p>
          </div>

          <Stack gap={2} className="mb-4">
            <div className="d-flex align-items-center">
              <strong>CPR nummer:</strong> 
              <span className="ms-2 me-3">{showCpr ? resident.cprNr : "******-****"}</span>
              <Button size="sm" variant="outline-primary" onClick={() => setShowCpr(!showCpr)}>
                {showCpr ? "Skjul" : "Vis"}
              </Button>
            </div>
            <div>
              <strong>Associated Journal ID:</strong> 
              <span className="ms-2">{resident.journalId || "Ingen Journal Id fundet"}</span>
            </div>
          </Stack>

          <hr />

          <Stack direction="horizontal" gap={3} className="justify-content-end">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate(`/residents/edit/${id}`)}
            >
              Rediger Information
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
            >
              Slet Resident
            </Button>
          </Stack>
        </Card.Body>
      </Card>
    </Container>
  );
}
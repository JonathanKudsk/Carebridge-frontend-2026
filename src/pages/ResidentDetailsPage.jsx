import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Button, Stack, Spinner, Alert, Accordion } from "react-bootstrap";
import { getResidentById, deactivateResident, getJournalEntries } from "../api/api.js";

const formatDateTime = (arr) => {
  if (!arr) return "";
  const [y, mo, d, h, mi, s] = arr;
  return new Date(y, mo - 1, d, h, mi, s).toLocaleString("da-DK");
};

export default function ResidentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCpr, setShowCpr] = useState(false);

  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState(null);

  useEffect(() => {
    async function fetchResident() {
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
    }
    fetchResident();
  }, [id]);

  useEffect(() => {
    if (!resident?.journalId) return;
    async function fetchEntries() {
      try {
        setEntriesLoading(true);
        const data = await getJournalEntries(resident.journalId);
        setEntries(data || []);
        setEntriesError(null);
      } catch (err) {
        console.error(err);
        setEntriesError("Kunne ikke hente journal entries.");
      } finally {
        setEntriesLoading(false);
      }
    }
    fetchEntries();
  }, [resident?.journalId]);

  const handleDeactivate = async () => {
    if (window.confirm(`Er du sikker på, at du vil deaktivere denne Beboer ${resident.firstName}?`)) {
      try {
        await deactivateResident(id);
        navigate("/resident-overview"); 
      } catch (err) {
        console.error(err);
        setError("Noget gik galt");
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Ingen dato";

    const date = new Date(timestamp * 1000);

    return date.toLocaleDateString("da-DK", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (!resident) return null;

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
          Beboer Profil
        </Card.Header>
        <Card.Body>
        
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h2 className="mb-1">
                  {resident.firstName} {resident.lastName}
                </h2>
                <p className="text-muted">Beboer ID: {resident.id}</p>
                <p className="text-muted">Bruger ID: {resident.userId}</p>
              </div>
              <span
                className={`badge ${resident.active ? "bg-success" : "bg-danger"}`}
              >
                {resident.active ? "Aktiv" : "Deaktiveret"}
              </span>
            </div>
          </div>

        
          <Stack gap={2} className="mb-4">
            <div className="d-flex align-items-center">
              <strong>CPR nummer:</strong>
              <span className="ms-2 me-3">
                {showCpr ? resident.cprNr : "******-****"}
              </span>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => setShowCpr(!showCpr)}
              >
                {showCpr ? "Skjul" : "Vis"}
              </Button>
            </div>
            <div>
              <strong>Alder:</strong>{" "}
              <span className="ms-2">{resident.age || "Ikke oplyst"} år</span>
            </div>
            <div>
              <strong>Køn:</strong>{" "}
              <span className="ms-2">{resident.gender || "Ikke oplyst"}</span>
            </div>
            <div>
              <strong>Tilknyttet Journal:</strong>
              <span className="ms-2">
                {resident.journalId
                  ? `#${resident.journalId}`
                  : "Ingen Journal fundet"}
              </span>
            </div>
            <div>
              <strong>Medicin ID:</strong>
              <span className="ms-2">
                {resident.medicationChartId
                  ? `#${resident.medicationChartId}`
                  : "Intet medicinkort tilknyttet"}
              </span>
            </div>
          </Stack>

          <hr />

        
          <h6 className="text-primary mb-3">Kontaktoplysninger</h6>
          <Stack gap={2}>
            
            <div>
              <strong>Email:</strong>{" "}
              <span className="ms-2">
                {resident.displayEmail ||
                  "Ingen kontakt-email"}
              </span>
            </div>
            <div>
              <strong>Telefon:</strong>{" "}
              <span className="ms-2">
                {resident.displayPhone || "Ikke oplyst"}
              </span>
            </div>

            <div className="mt-3 p-2 bg rounded shadow-sm border">
              <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                <div>
                  <strong>Oprettet i systemet:</strong>{" "}
                  {resident.createdAt
                    ? formatDate(resident.createdAt)
                    : "Ukendt"}
                </div>
                <div>
                  <strong>Sidst opdateret:</strong>{" "}
                  {resident.updatedAt
                    ? formatDate(resident.updatedAt)
                    : "Aldrig opdateret"}
                </div>
              </div>
            </div>
          </Stack>

          <hr />
          <Stack direction="horizontal" gap={3} className="justify-content-end">
            <Button
              variant="primary"
              onClick={() => navigate(`/residents/${id}/create-journal`)}
            >
              Opret Journal Entry
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => navigate(`/residents/edit/${id}`)}
            >
              Rediger Information
            </Button>
            <Button variant="danger" onClick={handleDeactivate}>
              Deaktiver Beboer
            </Button>
          </Stack>
        </Card.Body>
      </Card>

      {resident.journalId && (
        <Card className="shadow-sm mt-4">
          <Card.Header as="h5" className="bg-primary text-white">
            Journal entries
          </Card.Header>
          <Card.Body>
            {entriesLoading && <Spinner animation="border" size="sm" />}
            {entriesError && <Alert variant="danger">{entriesError}</Alert>}
            {!entriesLoading && !entriesError && entries.length === 0 && (
              <p className="text-muted mb-0">Ingen journal entries endnu.</p>
            )}
            {!entriesLoading && entries.length > 0 && (
              <Accordion>
                {entries.map((entry) => (
                  <Accordion.Item key={entry.id} eventKey={String(entry.id)}>
                    <Accordion.Header>
                      <div className="d-flex flex-column">
                        <strong>{entry.title}</strong>
                        <small className="text-muted">
                          {formatDateTime(entry.createdAt)} —{" "}
                          {entry.entryType?.toLowerCase() || "—"}
                        </small>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <p>
                        <strong>Type:</strong>{" "}
                        {entry.entryType?.toLowerCase() || "—"}
                      </p>
                      <p>
                        <strong>Risikoniveau:</strong>{" "}
                        {entry.riskAssessment || "—"}
                      </p>
                      <p>
                        <strong>Forfatter:</strong>{" "}
                        {entry.authorUserId || "Ukendt"}
                      </p>
                      <p>
                        <strong>Oprettet:</strong>{" "}
                        {formatDateTime(entry.createdAt)}
                      </p>
                      {formatDateTime(entry.updatedAt) &&
                        formatDateTime(entry.updatedAt) !==
                          formatDateTime(entry.createdAt) && (
                          <p>
                            <strong>Opdateret:</strong>{" "}
                            {formatDateTime(entry.updatedAt)}
                          </p>
                        )}
                      <hr />
                      <p style={{ whiteSpace: "pre-wrap" }}>{entry.content}</p>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}
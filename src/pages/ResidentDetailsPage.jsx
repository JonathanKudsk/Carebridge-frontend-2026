import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Button, Stack, Spinner, Alert, Accordion } from "react-bootstrap";
import { getResidentById, deactivateResident, getJournalEntries } from "../api/api.js";
import api from "../services/api";

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
  const [budget, setBudget] = useState(null);

    useEffect(() => {

        async function fetchBudget() {

            try {

                const response =
                    await api.get(
                        `/budgets/resident/${id}`
                    );

                setBudget(response.data);

            } catch (err) {

                console.log("No budget found");
            }
        }

        fetchBudget();

    }, [id]);

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
            <Button
              variant="danger"
              onClick={handleDeactivate}
            >
              Deaktiver Beboer
            </Button>
              <Button
                  variant="success"
                  onClick={() =>
                      navigate(`/residents/${id}/create-budget`)
                  }
              >
                  Opret Budget
              </Button>
          </Stack>
        </Card.Body>
      </Card>

        {budget && (

            <Card className="shadow-sm mt-4">

                <Card.Header
                    as="h5"
                    className="bg-success text-white"
                >
                    Budget
                </Card.Header>

                <Card.Body>

                    <p>
                        <strong>Income:</strong>
                        {" "}
                        {budget.income}
                    </p>

                    <p>
                        <strong>Fixed Expenses:</strong>
                        {" "}
                        {budget.fixedExpenses}
                    </p>

                    <p>
                        <strong>Variable Expenses:</strong>
                        {" "}
                        {budget.variableExpenses}
                    </p>

                    <p>
                        <strong>Pocket Money:</strong>
                        {" "}
                        {budget.pocketMoneyAmount}
                    </p>

                    <p>
                        <strong>Savings:</strong>
                        {" "}
                        {budget.savingsAmount}
                    </p>

                    <p>
                        <strong>Notes:</strong>
                        {" "}
                        {budget.notes || "No notes"}
                    </p>

                </Card.Body>

            </Card>
        )}

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
                          {formatDateTime(entry.createdAt)} — {entry.entryType?.toLowerCase() || "—"}
                        </small>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <p><strong>Type:</strong> {entry.entryType?.toLowerCase() || "—"}</p>
                      <p><strong>Risikoniveau:</strong> {entry.riskAssessment || "—"}</p>
                      <p><strong>Forfatter:</strong> {entry.authorUserId || "Ukendt"}</p>
                      <p><strong>Oprettet:</strong> {formatDateTime(entry.createdAt)}</p>
                      {formatDateTime(entry.updatedAt) &&
                        formatDateTime(entry.updatedAt) !== formatDateTime(entry.createdAt) && (
                          <p><strong>Opdateret:</strong> {formatDateTime(entry.updatedAt)}</p>
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
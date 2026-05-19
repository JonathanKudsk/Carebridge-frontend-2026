import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container, Card, Button, Spinner, Alert, Stack
} from "react-bootstrap";
import { getResidentById } from "../api/api";
import {
  getSavingsGoalsByResident,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
} from "../api/savingsGoalApi";
import SavingsGoalCard from "../components/Budget/SavingsGoalCard";
import SavingsGoalForm from "../components/Budget/SavingsGoalForm";

export default function SavingsGoalsPage() {
  const { id: residentId } = useParams();
  const navigate = useNavigate();

  const [resident, setResident] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [residentData, goalsData] = await Promise.all([
          getResidentById(residentId),
          getSavingsGoalsByResident(residentId),
        ]);
        setResident(residentData);
        setGoals(goalsData || []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Kunne ikke hente data. Prøv igen.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [residentId]);

  function flash(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function handleCreate(payload) {
    const created = await createSavingsGoal({ ...payload, budgetId: resident.budgetId });
    setGoals((prev) => [...prev, created]);
    setShowForm(false);
    flash("Opsparingsmål oprettet!");
  }

  async function handleUpdate(goalId, payload) {
    const updated = await updateSavingsGoal(goalId, payload);
    setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
    flash("Opsparingsmål opdateret!");
  }

  async function handleDelete(goalId) {
    await deleteSavingsGoal(goalId);
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    flash("Opsparingsmål slettet.");
  }

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
        <Button onClick={() => navigate(`/residents/${residentId}`)}>Tilbage</Button>
      </Container>
    );
  }

  const noBudget = !resident?.budgetId;

  return (
    <Container className="mt-4">
      <Button
        variant="link"
        onClick={() => navigate(`/residents/${residentId}`)}
        className="mb-3 p-0 text-decoration-none"
      >
        &larr; Tilbage til {resident?.firstName} {resident?.lastName}
      </Button>

      {/* Resident info */}
      <Card className="shadow-sm mb-4">
        <Card.Header as="h5" className="bg-primary text-white">
          Opsparingsmål — {resident?.firstName} {resident?.lastName}
        </Card.Header>
        <Card.Body>
          <Stack direction="horizontal" gap={4} className="text-muted">
            <span><strong>ID:</strong> {resident?.id}</span>
            <span><strong>CPR:</strong> ******-****</span>
            {noBudget && (
              <Alert variant="warning" className="mb-0 py-1 px-2 small">
                Ingen budget oprettet for denne beboer. Opret et budget (US-4a) først.
              </Alert>
            )}
          </Stack>
        </Card.Body>
      </Card>

      {successMsg && <Alert variant="success" className="py-2">{successMsg}</Alert>}

      {/* Goals list */}
      {goals.length === 0 && !showForm && (
        <p className="text-muted">Ingen opsparingsmål endnu.</p>
      )}

      {goals.map((goal) => (
        <SavingsGoalCard
          key={goal.id}
          goal={goal}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}

      {/* Add form */}
      {showForm ? (
        <Card className="shadow-sm mb-3">
          <Card.Header as="h6" className="bg-light">Nyt opsparingsmål</Card.Header>
          <Card.Body>
            <SavingsGoalForm
              budgetId={resident?.budgetId}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </Card.Body>
        </Card>
      ) : (
        <Button
          variant="success"
          onClick={() => setShowForm(true)}
          disabled={noBudget}
          title={noBudget ? "Opret budget for beboeren først" : ""}
        >
          + Tilføj opsparingsmål
        </Button>
      )}
    </Container>
  );
}

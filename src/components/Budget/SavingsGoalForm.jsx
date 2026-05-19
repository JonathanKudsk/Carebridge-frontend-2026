import { useState, useEffect } from "react";
import { Form, Button, Stack, Alert } from "react-bootstrap";

export default function SavingsGoalForm({ budgetId, existingGoal, onSubmit, onCancel }) {
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [monthlySavingAmount, setMonthlySavingAmount] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(existingGoal);

  useEffect(() => {
    if (existingGoal) {
      setGoalName(existingGoal.goalName || "");
      setTargetAmount(String(existingGoal.targetAmount ?? ""));
      setMonthlySavingAmount(String(existingGoal.monthlySavingAmount ?? ""));
      setCurrentBalance(String(existingGoal.currentBalance ?? ""));
    }
  }, [existingGoal]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const target = parseFloat(targetAmount);
    const monthly = parseFloat(monthlySavingAmount);
    const balance = parseFloat(currentBalance);

    if (!goalName.trim()) return setError("Navn på mål er påkrævet.");
    if (isNaN(target) || target <= 0) return setError("Målbeløb skal være større end 0.");
    if (isNaN(monthly) || monthly <= 0) return setError("Månedligt beløb skal være større end 0.");
    if (isNaN(balance) || balance < 0) return setError("Nuværende saldo kan ikke være negativ.");

    setSaving(true);
    try {
      const payload = isEdit
        ? { goalName: goalName.trim(), targetAmount: target, monthlySavingAmount: monthly, currentBalance: balance }
        : { budgetId, goalName: goalName.trim(), targetAmount: target, monthlySavingAmount: monthly, currentBalance: balance };

      await onSubmit(payload);
    } catch (err) {
      setError(err?.response?.data || "Noget gik galt. Prøv igen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger" className="py-2">{error}</Alert>}

      <Stack gap={3}>
        <Form.Group controlId="goalName">
          <Form.Label>Navn på opsparingsmål</Form.Label>
          <Form.Control
            type="text"
            placeholder="F.eks. Sommerferie, Ny cykel..."
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="targetAmount">
          <Form.Label>Målbeløb (kr.)</Form.Label>
          <Form.Control
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="monthlySavingAmount">
          <Form.Label>Månedligt opsparingsbeløb (kr.)</Form.Label>
          <Form.Control
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={monthlySavingAmount}
            onChange={(e) => setMonthlySavingAmount(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="currentBalance">
          <Form.Label>Nuværende saldo (kr.)</Form.Label>
          <Form.Control
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
            required
          />
        </Form.Group>

        <Stack direction="horizontal" gap={2} className="justify-content-end">
          <Button variant="outline-secondary" onClick={onCancel} disabled={saving}>
            Annuller
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? "Gemmer..." : isEdit ? "Gem ændringer" : "Opret mål"}
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}

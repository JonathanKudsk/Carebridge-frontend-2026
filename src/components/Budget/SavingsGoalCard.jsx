import { useState } from "react";
import { Card, ProgressBar, Button, Stack, Badge } from "react-bootstrap";
import SavingsGoalForm from "./SavingsGoalForm";

function formatAmount(amount) {
  return new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK" }).format(amount);
}

function monthsRemaining(currentBalance, targetAmount, monthlySavingAmount) {
  const remaining = targetAmount - currentBalance;
  if (remaining <= 0) return 0;
  if (monthlySavingAmount <= 0) return null;
  return Math.ceil(remaining / monthlySavingAmount);
}

export default function SavingsGoalCard({ goal, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);

  const progress = Math.min(goal.progressPercentage ?? 0, 100);
  const isComplete = progress >= 100;
  const months = monthsRemaining(goal.currentBalance, goal.targetAmount, goal.monthlySavingAmount);

  async function handleUpdate(payload) {
    await onUpdate(goal.id, payload);
    setEditing(false);
  }

  return (
    <Card className="shadow-sm mb-3">
      <Card.Body>
        {editing ? (
          <>
            <Card.Title className="mb-3">Rediger: {goal.goalName}</Card.Title>
            <SavingsGoalForm
              existingGoal={goal}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(false)}
            />
          </>
        ) : (
          <>
            <Stack direction="horizontal" className="justify-content-between mb-2">
              <Card.Title className="mb-0">
                {goal.goalName}
                {isComplete && (
                  <Badge bg="success" className="ms-2">Opnået!</Badge>
                )}
              </Card.Title>
              <Stack direction="horizontal" gap={2}>
                <Button size="sm" variant="outline-primary" onClick={() => setEditing(true)}>
                  Rediger
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => {
                    if (window.confirm(`Slet opsparingsmål "${goal.goalName}"?`)) onDelete(goal.id);
                  }}
                >
                  Slet
                </Button>
              </Stack>
            </Stack>

            <div className="mb-2">
              <ProgressBar
                now={progress}
                label={`${progress.toFixed(1)}%`}
                variant={isComplete ? "success" : progress >= 50 ? "info" : "primary"}
                style={{ height: "1.2rem" }}
              />
            </div>

            <Stack direction="horizontal" gap={4} className="text-muted small">
              <span>
                <strong>Opsparet:</strong> {formatAmount(goal.currentBalance)}
              </span>
              <span>
                <strong>Mål:</strong> {formatAmount(goal.targetAmount)}
              </span>
              <span>
                <strong>Månedligt:</strong> {formatAmount(goal.monthlySavingAmount)}
              </span>
              {!isComplete && months !== null && (
                <span>
                  <strong>Ca. måneder tilbage:</strong> {months}
                </span>
              )}
            </Stack>
          </>
        )}
      </Card.Body>
    </Card>
  );
}

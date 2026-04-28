import { useState, useEffect, useCallback } from "react";
import { Table, Button, Alert, Spinner, Badge } from "react-bootstrap";
import { getMedicationChart, deleteMedication } from "../../api/medicationApi";
import { getCurrentUser } from "../../services/auth";
import MedicationEditForm from "./MedicationEditForm";

export default function MedicationList({ chartId }) {
  const [medications, setMedications] = useState([]);
  const [status, setStatus] = useState("loading");
  const [editingId, setEditingId] = useState(null);

  const user = getCurrentUser();
  const canEdit = user?.role === "CAREWORKER" || user?.role === "ADMIN";
  const canDelete = user?.role === "ADMIN";

  const fetchChart = useCallback(() => {
    setStatus("loading");
    getMedicationChart(chartId)
      .then((chart) => {
        setMedications(chart.medications ?? []);
        setStatus("idle");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [chartId]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  async function handleDelete(medicationId) {
    if (!window.confirm("Delete this medication?")) return;
    try {
      await deleteMedication(chartId, medicationId);
      setMedications((prev) => prev.filter((m) => m.id !== medicationId));
    } catch {
      alert("Failed to delete medication.");
    }
  }

  function handleSaved() {
    setEditingId(null);
    fetchChart();
  }

  if (status === "loading") {
    return (
      <div className="d-flex align-items-center gap-2 text-muted">
        <Spinner animation="border" size="sm" />
        <span>Loading medications...</span>
      </div>
    );
  }

  if (status === "error") {
    return <Alert variant="danger">Failed to load medication chart.</Alert>;
  }

  if (medications.length === 0) {
    return <p className="text-muted">No medications registered on this chart.</p>;
  }

  return (
    <div>
      {editingId && (
        <div className="mb-4">
          <MedicationEditForm
            chartId={chartId}
            medicationId={editingId}
            onSaved={handleSaved}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Notes</th>
            {(canEdit || canDelete) && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {medications.map((med) => (
            <tr key={med.id} className={editingId === med.id ? "table-active" : ""}>
              <td>{med.name}</td>
              <td>
                <Badge bg="secondary">{med.dosage}</Badge>
              </td>
              <td>{med.frequency}</td>
              <td>{med.notes || <span className="text-muted">—</span>}</td>
              {(canEdit || canDelete) && (
                <td>
                  <div className="d-flex gap-2">
                    {canEdit && (
                      <Button
                        size="sm"
                        variant={editingId === med.id ? "outline-secondary" : "outline-primary"}
                        onClick={() => setEditingId(editingId === med.id ? null : med.id)}
                      >
                        {editingId === med.id ? "Close" : "Edit"}
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(med.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

import { useState } from "react";
import { Form, Button, Alert, Card } from "react-bootstrap";
import { addMedication } from "../../api/medicationApi";

const EMPTY_FORM = { name: "", dosage: "", frequency: "", notes: "" };

export default function AddMedicationForm({ chartId, onSaved, onCancel }) {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [status, setStatus] = useState("idle");
    const [errorMessage, setErrorMessage] = useState("");

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrorMessage("");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErrorMessage("");

        if (!formData.name.trim()) {
            setErrorMessage("Name is required.");
            return;
        }
        if (!formData.dosage.trim()) {
            setErrorMessage("Dosage is required.");
            return;
        }
        if (!formData.frequency.trim()) {
            setErrorMessage("Frequency is required.");
            return;
        }

        setStatus("saving");
        try {
            await addMedication(chartId, formData);
            setFormData(EMPTY_FORM);
            setStatus("idle");
            if (onSaved) onSaved();
        } catch (err) {
            setErrorMessage("An error occurred while saving. Please try again.");
            setStatus("idle");
        }
    }

    return (
        <Card className="p-3 shadow-sm">
            <Card.Body>
                <Card.Title>Add Medication</Card.Title>

                {errorMessage && (
                    <Alert variant="warning" className="mb-3">
                        {errorMessage}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Name *</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Paracetamol"
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Dosage *</Form.Label>
                        <Form.Control
                            type="text"
                            name="dosage"
                            value={formData.dosage}
                            onChange={handleChange}
                            placeholder="e.g. 2 tablets"
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Frequency *</Form.Label>
                        <Form.Control
                            type="text"
                            name="frequency"
                            value={formData.frequency}
                            onChange={handleChange}
                            placeholder="e.g. Morning and evening"
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Notes</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="e.g. Take with food"
                        />
                    </Form.Group>

                    <div className="d-flex gap-2">
                        <Button type="submit" disabled={status === "saving"}>
                            {status === "saving" ? "Saving..." : "Add medication"}
                        </Button>
                        {onCancel && (
                            <Button variant="secondary" onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}
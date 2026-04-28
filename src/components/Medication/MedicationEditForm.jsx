import { useState, useEffect } from "react";
import { Form, Button, Alert, Card } from "react-bootstrap";
import { getMedication, updateMedication } from "../../api/medicationApi";

const EMPTY_FORM = { name: "", dosage: "", frequency: "", notes: "" };

function formFromMedication(med) {
    return {
        name: med.name ?? "",
        dosage: med.dosage ?? "",
        frequency: med.frequency ?? "",
        notes: med.notes ?? "",
    };
}

function hasChanges(current, original) {
    return (
        current.name !== original.name ||
        current.dosage !== original.dosage ||
        current.frequency !== original.frequency ||
        current.notes !== original.notes
    );
}

export default function MedicationEditForm({ chartId, medicationId, onSaved, onCancel }) {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [original, setOriginal] = useState(EMPTY_FORM);
    const [status, setStatus] = useState("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        setStatus("loading");
        setErrorMessage("");

        getMedication(chartId, medicationId)
            .then((med) => {
                const values = formFromMedication(med);
                setFormData(values);
                setOriginal(values);
                setStatus("idle");
            })
            .catch(() => {
                setStatus("fetchError");
            });
    }, [chartId, medicationId]);

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrorMessage("");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErrorMessage("");

        if (!hasChanges(formData, original)) {
            setErrorMessage("No changes were made. Please modify at least one field before saving.");
            return;
        }

        setStatus("saving");
        try {
            await updateMedication(chartId, medicationId, formData);
            setOriginal(formData);
            setStatus("idle");
            if (onSaved) onSaved();
        } catch (err) {
            const serverMessage = err.response?.data?.message || err.response?.data;
            if (err.response?.status === 400 || err.response?.status === 409) {
                setErrorMessage(
                    typeof serverMessage === "string"
                        ? serverMessage
                        : "No changes were detected by the server."
                );
            } else {
                setErrorMessage("An error occurred while saving. Please try again.");
            }
            setStatus("idle");
        }
    }

    if (status === "loading") {
        return <p className="text-muted">Loading medication...</p>;
    }

    if (status === "fetchError") {
        return <Alert variant="danger">Failed to load medication data.</Alert>;
    }

    return (
        <Card className="p-3 shadow-sm">
            <Card.Body>
                <Card.Title>Edit Medication</Card.Title>

                {errorMessage && (
                    <Alert variant="warning" className="mb-3">
                        {errorMessage}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Dosage</Form.Label>
                        <Form.Control
                            type="text"
                            name="dosage"
                            value={formData.dosage}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Frequency</Form.Label>
                        <Form.Control
                            type="text"
                            name="frequency"
                            value={formData.frequency}
                            onChange={handleChange}
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
                        />
                    </Form.Group>

                    <div className="d-flex gap-2">
                        <Button type="submit" disabled={status === "saving"}>
                            {status === "saving" ? "Saving..." : "Save changes"}
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
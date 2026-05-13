import { useState, useEffect } from "react";
import {
    Button, Form, Row, Col, Spinner, Badge, Modal
} from "react-bootstrap";
import ResidentList from "../components/ResidentList";
import { getMedicationChart, updateMedication } from "../api/medicationApi";

export default function MedicationPage() {
    const [selectedResident, setSelectedResident] = useState(null);
    const [chart, setChart] = useState(null);
    const [chartLoading, setChartLoading] = useState(false);
    const [editingMedId, setEditingMedId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [showConflict, setShowConflict] = useState(false);

    useEffect(() => {
        if (!selectedResident) return;
        setChart(null);
        setEditingMedId(null);
        fetchChart(selectedResident.medicationChartId);
    }, [selectedResident]);

    async function fetchChart(chartId) {
        setChartLoading(true);
        try {
            const data = await getMedicationChart(chartId);
            setChart(data);
        } catch (err) {
            console.error("Failed to fetch medication chart", err);
            setChart(null);
        } finally {
            setChartLoading(false);
        }
    }

    function handleSelectResident(r) {
        setSelectedResident(r);
    }

    function startEdit(med) {
        setEditingMedId(med.id);
        setEditForm({
            name: med.name ?? "",
            dosage: med.dosage ?? "",
            frequency: med.frequency ?? "",
            startDate: med.startDate ?? "",
            endDate: med.endDate ?? "",
            prescribingDoctor: med.prescribingDoctor ?? "",
            notes: med.notes ?? "",
            active: med.active,
            version: med.version,
        });
    }

    function cancelEdit() {
        setEditingMedId(null);
        setEditForm({});
    }

    function handleFormChange(e) {
        const { name, value, type, checked } = e.target;
        setEditForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    async function handleSave(chartId, medicationId) {
        setSaving(true);
        try {
            const updated = await updateMedication(chartId, medicationId, editForm);
            setChart((prev) => ({
                ...prev,
                medications: prev.medications.map((m) =>
                    m.id === medicationId ? updated : m
                ),
            }));
            setEditingMedId(null);
        } catch (err) {
            if (err.response?.status === 409) {
                setShowConflict(true);
                setEditingMedId(null);
                await fetchChart(chartId);
            } else {
                console.error("Failed to update medication", err);
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            <h1 className="h4 mb-3">Medication Page</h1>

            <ResidentList onSelect={handleSelectResident} />

            {selectedResident && (
                <div className="mt-4">
                    <h3>
                        {selectedResident.firstName} {selectedResident.lastName}
                    </h3>
                    <p><strong>CPR:</strong> {selectedResident.cprNr || "—"}</p>
                    <p><strong>Alder:</strong> {selectedResident.age || "—"}</p>
                    <p><strong>Køn:</strong> {selectedResident.gender || "—"}</p>

                    <hr />

                    <h5>Medicinkort</h5>

                    {chartLoading && <Spinner animation="border" size="sm" className="mb-3" />}

                    {!chartLoading && chart && chart.medications.length === 0 && (
                        <p className="text-muted">Ingen medicin registreret.</p>
                    )}

                    {!chartLoading && chart && chart.medications.map((med) => (
                        <div key={med.id} className="border rounded p-3 mb-2">
                            {editingMedId === med.id ? (
                                <EditMedicationForm
                                    form={editForm}
                                    onChange={handleFormChange}
                                    onSave={() => handleSave(chart.id, med.id)}
                                    onCancel={cancelEdit}
                                    saving={saving}
                                />
                            ) : (
                                <MedicationRow
                                    med={med}
                                    onEdit={() => startEdit(med)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Modal show={showConflict} onHide={() => setShowConflict(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Konflikt opdaget</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    En anden bruger har allerede opdateret denne medicin. Dine ændringer er
                    ikke gemt. Gennemgå venligst de nye data herunder og prøv igen.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => setShowConflict(false)}>
                        OK
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

function MedicationRow({ med, onEdit }) {
    return (
        <div className="d-flex justify-content-between align-items-start">
            <div>
                <strong>{med.name}</strong>{" "}
                {!med.active && <Badge bg="secondary">Inaktiv</Badge>}
                <div className="text-muted small">
                    {med.dosage && <span>Dosis: {med.dosage} &nbsp;</span>}
                    {med.frequency && <span>Frekvens: {med.frequency} &nbsp;</span>}
                    {med.prescribingDoctor && <span>Læge: {med.prescribingDoctor}</span>}
                </div>
                {med.notes && <div className="small mt-1">{med.notes}</div>}
            </div>
            <Button size="sm" variant="outline-primary" onClick={onEdit}>
                Rediger
            </Button>
        </div>
    );
}

function EditMedicationForm({ form, onChange, onSave, onCancel, saving }) {
    return (
        <Form>
            <Row className="mb-2">
                <Col md={6}>
                    <Form.Group>
                        <Form.Label>Navn</Form.Label>
                        <Form.Control
                            name="name"
                            value={form.name}
                            onChange={onChange}
                        />
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Dosis</Form.Label>
                        <Form.Control
                            name="dosage"
                            value={form.dosage}
                            onChange={onChange}
                        />
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Frekvens</Form.Label>
                        <Form.Control
                            name="frequency"
                            value={form.frequency}
                            onChange={onChange}
                        />
                    </Form.Group>
                </Col>
            </Row>
            <Row className="mb-2">
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Startdato</Form.Label>
                        <Form.Control
                            type="date"
                            name="startDate"
                            value={form.startDate}
                            onChange={onChange}
                        />
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Slutdato</Form.Label>
                        <Form.Control
                            type="date"
                            name="endDate"
                            value={form.endDate}
                            onChange={onChange}
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group>
                        <Form.Label>Ordinerende læge</Form.Label>
                        <Form.Control
                            name="prescribingDoctor"
                            value={form.prescribingDoctor}
                            onChange={onChange}
                        />
                    </Form.Group>
                </Col>
            </Row>
            <Form.Group className="mb-2">
                <Form.Label>Noter</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={2}
                    name="notes"
                    value={form.notes}
                    onChange={onChange}
                />
            </Form.Group>
            <Form.Check
                type="checkbox"
                name="active"
                label="Aktiv"
                checked={form.active}
                onChange={onChange}
                className="mb-3"
            />
            <div className="d-flex gap-2">
                <Button onClick={onSave} disabled={saving}>
                    {saving ? <Spinner animation="border" size="sm" /> : "Gem"}
                </Button>
                <Button variant="secondary" onClick={onCancel} disabled={saving}>
                    Annuller
                </Button>
            </div>
        </Form>
    );
}

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Button, Modal } from "react-bootstrap";
import MedicationList from "../components/Medication/MedicationList";
import AddMedicationForm from "../components/Medication/AddMedicationForm";

export default function MedicationChartPage() {
    const { residentId } = useParams();
    const navigate = useNavigate();
    const [showAddModal, setShowAddModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    function handleSaved() {
        setShowAddModal(false);
        setRefreshKey(prev => prev + 1);
    }

    return (
        <Container className="mt-4">
            <Button
                variant="link"
                onClick={() => navigate(-1)}
                className="mb-3 p-0 text-decoration-none"
            >
                &larr; Back
            </Button>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Medication Chart</h2>
                <Button
                    variant="primary"
                    onClick={() => setShowAddModal(true)}
                >
                    + Add Medication
                </Button>
            </div>

            <MedicationList key={refreshKey} chartId={residentId} />

            <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Medication</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <AddMedicationForm
                        chartId={residentId}
                        onSaved={handleSaved}
                        onCancel={() => setShowAddModal(false)}
                    />
                </Modal.Body>
            </Modal>
        </Container>
    );
}
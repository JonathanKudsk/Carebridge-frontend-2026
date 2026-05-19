import { useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import ResidentList from "../components/ResidentList";

export default function MedicationPage() {
    const navigate = useNavigate();

    function handleResidentSelect(resident) {
        navigate(`/medication-chart/${resident.id}`);
    }

    return (
        <Container className="mt-4">
            <h1 className="h4 mb-3">Medication</h1>
            <p className="text-muted mb-4">
                Select a resident to view and manage their medication chart.
            </p>
            <ResidentList onSelect={handleResidentSelect} />
        </Container>
    );
}

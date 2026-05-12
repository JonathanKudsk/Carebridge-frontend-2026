import ResidentList from "../components/ResidentList";
import { useNavigate } from "react-router-dom";

export default function MedicationPage() {
    const navigate = useNavigate();

    function handleResidentSelect(resident) {
        navigate(`/medication-chart/${resident.id}`);
    }

    return (
        <div>
            <h1 className="h4 mb-4">Medication Page</h1>

            <ResidentList onSelect={handleResidentSelect} />
        </div>
    );
}
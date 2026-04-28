import { useState } from "react";
import ResidentList from "../components/ResidentList";
import MedicationList from "../components/Medication/MedicationList";

export default function MedicationPage() {
    const [selectedResident, setSelectedResident] = useState(null);
    console.log("SELECTED RESIDENT:", selectedResident);
    return (
        <div>
            <h1 className="h4 mb-3">Medication Page</h1>

            {/* US-2A: vis liste */}
            <ResidentList onSelect={setSelectedResident} />

            {/* US-2B: klik → vis medicin */}
            {selectedResident && (
                <div className="mt-4">
                    <h3>
                        {selectedResident.firstName} {selectedResident.lastName}
                    </h3>

                    <MedicationList chartId={selectedResident.medicationChartId} />
                </div>
            )}
        </div>
    );
}
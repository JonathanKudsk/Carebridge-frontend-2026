import { useState } from "react";
import ResidentList from "../components/ResidentList";

export default function MedicationPage() {
    const [selectedResident, setSelectedResident] = useState(null);

    return (
        <div>
            <h1 className="h4 mb-3">Medication Page</h1>

            {/* Liste */}
            <ResidentList onSelect={setSelectedResident} />

            {/* Detail view */}
            {selectedResident && (
                <div className="mt-4">
                    <h3>
                        {selectedResident.firstName} {selectedResident.lastName}
                    </h3>

                    <p><strong>CPR:</strong> {selectedResident.cprNr || "—"}</p>
                    <p><strong>Alder:</strong> {selectedResident.age || "—"}</p>
                    <p><strong>Køn:</strong> {selectedResident.gender || "—"}</p>
                    <p><strong>ID:</strong> {selectedResident.id}</p>

                    {/* midlertidig placeholder */}
                    <p className="text-muted">
                        (Medication overview kommer senere)
                    </p>
                </div>
            )}
        </div>
    );
}
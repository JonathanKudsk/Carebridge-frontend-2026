import { useState } from "react";
import { residents } from "../mock/residents";

export default function Resident() {
    const [selectedResident, setSelectedResident] = useState(null);

    function handleSelect(e) {
        const id = Number(e.target.value);
        const resident = residents.find(r => r.id === id);
        setSelectedResident(resident);
    }

    return (
        <div>
            <h2>Select Resident</h2>

            <select onChange={handleSelect}>
                <option value="">-- choose --</option>
                {residents.map(r => (
                    <option key={r.id} value={r.id}>
                        {r.firstName} {r.lastName}
                    </option>
                ))}
            </select>

            {selectedResident && (
                <div>
                    <h3>Medical Data</h3>

                    <p><strong>Notes:</strong> {selectedResident.medicalData.notes}</p>

                    <h4>Medications</h4>
                    <ul>
                        {selectedResident.medicalData.medications.map((med, index) => (
                            <li key={index}>
                                {med.name} - {med.dosage} ({med.time})
                            </li>
                        ))}
                    </ul>

                    <h4>Allergies</h4>
                    <ul>
                        {selectedResident.medicalData.allergies.map((a, index) => (
                            <li key={index}>{a}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
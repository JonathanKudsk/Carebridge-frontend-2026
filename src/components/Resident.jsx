import { useEffect, useState } from "react";
import { getResidents } from "../api/residentApi";

export default function Resident() {
    const [residents, setResidents] = useState([]);
    const [selectedResident, setSelectedResident] = useState(null);

    // hent fra backend
    useEffect(() => {
        getResidents()
            .then(setResidents)
            .catch(err => console.error("Failed to fetch residents", err));
    }, []);

    function handleSelect(e) {
        const id = Number(e.target.value);
        const resident = residents.find(r => r.id === id);
        setSelectedResident(resident);
    }

    console.log(residents);

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
                <div style={{ marginTop: "20px" }}>
                    <h3>
                        {selectedResident.firstName} {selectedResident.lastName}
                    </h3>

                    <p><strong>CPR:</strong> {selectedResident.cprNr || "—"}</p>
                    <p><strong>Alder:</strong> {selectedResident.age || "—"}</p>
                    <p><strong>Køn:</strong> {selectedResident.gender || "—"}</p>
                    <p><strong>ID:</strong> {selectedResident.id}</p>
                </div>
            )}
        </div>
    );
}
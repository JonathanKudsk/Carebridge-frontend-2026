import { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import { getResidents } from "../api/residentApi";

export default function ResidentList({ onSelect }) {
    const [residents, setResidents] = useState([]);

    useEffect(() => {
        getResidents()
            .then((data) => {
                setResidents(data);
            })
            .catch((err) => {
                console.error("Failed to fetch residents", err);
            });
    }, []);

    return (
        <div>
            <h2>Residents</h2>

            <Table striped hover>
                <thead>
                <tr>
                    <th>Name</th>
                    <th>CPR</th>
                </tr>
                </thead>

                <tbody>
                {residents.map((r) => (
                    <tr
                        key={r.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => onSelect(r)}
                    >
                        <td>{r.firstName} {r.lastName}</td>
                        <td>{r.cprNr || "—"}</td>
                    </tr>
                ))}
                </tbody>
            </Table>
        </div>
    );
}
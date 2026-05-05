import { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import { getResidents } from "../api/residentApi";

export default function ResidentList({ onSelect }) {
    const [residents, setResidents] = useState([]);
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        getResidents()
            .then((data) => {
                setResidents(data);
            })
            .catch((err) => {
                console.error("Failed to fetch residents", err);
            });
    }, []);

    function handleClick(r) {
        setSelectedId(r.id);
        onSelect(r);
    }

    return (
        <div>
            <h2>Residents</h2>

            <Table striped hover responsive>
                <thead>
                <tr>
                    <th>Name</th>
                    <th>CPR</th>
                    <th>Alder</th>
                    <th>Køn</th>
                </tr>
                </thead>

                <tbody>
                {residents.map((r) => (
                    <tr
                        key={r.id}
                        style={{
                            cursor: "pointer",
                            backgroundColor:
                                selectedId === r.id ? "#2c3034" : ""
                        }}
                        onClick={() => handleClick(r)}
                    >
                        <td>{r.firstName} {r.lastName}</td>
                        <td>{r.cprNr || "—"}</td>
                        <td>{r.age != null ? r.age : "—"}</td>
                        <td>{r.gender ? r.gender : "—"}</td>
                    </tr>
                ))}
                </tbody>
            </Table>
        </div>
    );
}
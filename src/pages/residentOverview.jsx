import { useEffect, useState } from "react";
import { Card } from "react-bootstrap";

export default function ResidentOverview() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchResidents() {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:7070/api/residents/sorted", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setResidents(data);

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchResidents();
  }, []);

  if (loading) return <p>Loading residents...</p>;
  if (error) return <p>Error: {error}</p>;
  if (residents.length === 0) return <p>No residents found</p>;

  return (
    <div>
      <h1 className="mb-4">Resident overview</h1>

      {residents.map((resident) => (
        <Card key={resident.id} className="mb-3">
          <Card.Body>
            <Card.Title className="mb-3">
              {resident.firstName} {resident.lastName}
            </Card.Title>

            <div className="mb-2">
              <strong>ID:</strong> {resident.id}
            </div>

            <div className="mb-2">
              <strong>Journal ID:</strong> {resident.journalId ?? "N/A"}
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
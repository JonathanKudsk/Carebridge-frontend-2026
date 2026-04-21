import { useEffect, useState } from "react";
import { Card, Form, ListGroup } from "react-bootstrap";

import { getResidents } from "../api/api";

export default function ResidentOverview() {
  const [residents, setResidents] = useState([]);
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("firstName");
  const [hasJournalOnly, setHasJournalOnly] = useState(false);

  useEffect(() => {
    async function loadResidents() {
      try {
        setLoading(true);
        setError(null);
        const data = await getResidents();
        setResidents(data);
        setFilteredResidents(data);
      } catch (err) {
        setError(err.message || "Failed to fetch residents");
      } finally {
        setLoading(false);
      }
    }

    loadResidents();
  }, []);

  useEffect(() => {
    const nextResidents = [...residents]
      .filter((resident) => {
        const fullName = `${resident.firstName} ${resident.lastName}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase());
        const matchesJournalFilter = hasJournalOnly ? Boolean(resident.journalId) : true;
        return matchesSearch && matchesJournalFilter;
      })
      .sort((a, b) =>
        (a[sortKey] || "").localeCompare(b[sortKey] || "", undefined, {
          sensitivity: "base",
        })
      );

    setFilteredResidents(nextResidents);
  }, [residents, searchTerm, sortKey, hasJournalOnly]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (filteredResidents.length === 0) return <p>No residents found</p>;

  return (
    <div>
      <h1 className="mb-4">Resident overview</h1>

      <Card className="mb-4">
        <Card.Body>
          <Form className="d-grid gap-3">
            <Form.Group controlId="residentSearch">
              <Form.Label>Search residents</Form.Label>
              <Form.Control
                type="text"
                placeholder="Search by first and last name"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="residentSort">
              <Form.Label>Sort by</Form.Label>
              <Form.Select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value)}
              >
                <option value="firstName">firstName</option>
                <option value="lastName">lastName</option>
              </Form.Select>
            </Form.Group>

            <Form.Check
              id="residentJournalFilter"
              type="checkbox"
              label="Show only residents with a journal"
              checked={hasJournalOnly}
              onChange={(event) => setHasJournalOnly(event.target.checked)}
            />
          </Form>
        </Card.Body>
      </Card>

      <ListGroup>
        {filteredResidents.map((resident) => (
          <ListGroup.Item key={resident.id}>
            <div className="fw-semibold">
              {resident.firstName} {resident.lastName}
            </div>
            <div className="text-muted small">ID: {resident.id}</div>
            <div className="text-muted small">
              Journal: {resident.journalId ? resident.journalId : "Not linked"}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
}

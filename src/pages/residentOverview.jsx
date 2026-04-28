import { useEffect, useState, useMemo } from "react";
import { Card, Form, ListGroup, Container } from "react-bootstrap";
import { getResidents } from "../api/api";

export default function ResidentOverview() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("firstName");
  const [hasJournalOnly, setHasJournalOnly] = useState(false);

  
  useEffect(() => {
    async function loadResidents() {
      try {
        setLoading(true);
        const data = await getResidents();
        setResidents(data);
      } catch (err) {
        setError(err.message || "Kunne ikke hente beboere");
      } finally {
        setLoading(false);
      }
    }
    loadResidents();
  }, []);

  const filteredResidents = useMemo(() => {
    return [...residents]
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
  }, [residents, searchTerm, sortKey, hasJournalOnly]);

  if (loading) return <Container className="mt-4"><p>Indlæser beboere...</p></Container>;
  if (error) return <Container className="mt-4"><p className="text-danger">{error}</p></Container>;

  return (
    <Container className="mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <h1 className="mb-4 text-center">Beboere</h1>

          <Card className="mb-4">
            <Card.Body>
              <Form className="d-grid gap-3">
                <Form.Group controlId="residentSearch">
                  <Form.Label>Søg efter beboer</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Fornavn eller efternavn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Form.Group>

                <Form.Group controlId="residentSort">
                  <Form.Label>Sorter efter</Form.Label>
                  <Form.Select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value)}
                  >
                    <option value="firstName">Fornavn</option>
                    <option value="lastName">Efternavn</option>
                  </Form.Select>
                </Form.Group>

                <Form.Check
                  id="residentJournalFilter"
                  type="checkbox"
                  label="Vis kun beboere med journal"
                  checked={hasJournalOnly}
                  onChange={(e) => setHasJournalOnly(e.target.checked)}
                />
              </Form>
            </Card.Body>
          </Card>

          <ListGroup>
            {filteredResidents.length > 0 ? (
              filteredResidents.map((resident) => (
                <ListGroup.Item key={resident.id}>
                  <div className="fw-semibold">
                    {resident.firstName} {resident.lastName}
                  </div>
                  <div className="text-muted small">ID: {resident.id}</div>
                  <div className="text-muted small">
                    Journal: {resident.journalId ? resident.journalId : "Ikke tilknyttet"}
                  </div>
                </ListGroup.Item>
              ))
            ) : (
              <p className="text-center mt-3">Ingen beboere fundet.</p>
            )}
          </ListGroup>
        </div>
      </div>
    </Container>
  );
}
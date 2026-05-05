import { useEffect, useMemo, useState } from "react";
import { Card, Form, ListGroup, Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function ResidentOverview() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("firstName");
  const [hasJournalOnly, setHasJournalOnly] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(0);
  const residentsPerPage = 10;
  const navigate = useNavigate();

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
        setError(err.message || "Kunne ikke hente beboere");
      } finally {
        setLoading(false);
      }
    }

    fetchResidents();
  }, []);

  const filteredResidents = useMemo(() => {
    return [...residents]
      .filter((resident) => {
        const fullName = `${resident.firstName} ${resident.lastName}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase());
        const matchesJournalFilter = hasJournalOnly ? Boolean(resident.journalId) : true;
        const matchesStatus = showInactive ? true : resident.active !== false;
        return matchesSearch && matchesJournalFilter && matchesStatus;
      })
      .sort((a, b) =>
        (a[sortKey] || "").localeCompare(b[sortKey] || "", undefined, {
          sensitivity: "base",
        })
      );
  }, [residents, searchTerm, sortKey, hasJournalOnly, showInactive]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, sortKey, hasJournalOnly, showInactive]);

  if (loading) {
    return (
      <Container className="mt-4">
        <p>Indlæser beboere...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <p className="text-danger">{error}</p>
      </Container>
    );
  }

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

                <Form.Check
                  id="showInactiveFilter"
                  type="checkbox"
                  label="Vis deaktiverede beboere"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="mt-2"
                />
              </Form>
            </Card.Body>
          </Card>

          <ListGroup>
            {filteredResidents.length > 0 ? (
              filteredResidents
                .slice(
                  page * residentsPerPage,
                  page * residentsPerPage + residentsPerPage
                )
                .map((resident) => (
                  <ListGroup.Item
                    key={resident.id}
                    action
                    onClick={() => navigate(`/residents/${resident.id}`)}
                    style={{ cursor: "pointer" }}
                  >
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

          <div className="d-flex justify-content-between mt-3">
            <div>
              {page > 0 && (
                <Button
                  variant="outline-primary"
                  onClick={() => setPage(page - 1)}
                >
                  Forrige
                </Button>
              )}
            </div>
            <span className="align-self-center">Side {page + 1}</span>
            <Button
              variant="outline-primary"
              disabled={page * residentsPerPage + residentsPerPage >= filteredResidents.length}
              onClick={() => setPage(page + 1)}
            >
              Næste
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}

import { useEffect, useState } from "react";
import { getAllResidents } from "../api/api.js";
import { ListGroup, Container, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function ResidentOverview() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const formatCpr = (cpr) => {
    if (!cpr) return "Ingen CPR";
    return cpr.substring(0, 6);
  };

  useEffect(() => {
    getAllResidents()
      .then(data => {
        setResidents(data);
        setError(false);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Container className="mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <h1 className="mb-4 text-center">Beboere</h1>

          {loading ? (
            <div className="text-center mt-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : error ? (
            <Alert variant="danger" className="text-center">
              Der opstod en fejl under hentning af data.
            </Alert>
          ) : residents.length > 0 ? (
            <ListGroup className="shadow-sm">
              {residents.map((r) => (
                <ListGroup.Item
                  key={r.id}
                  action
                  onClick={() => navigate(`/residents/${r.id}`)}
                  className="d-flex justify-content-between align-items-center p-3"
                >
                  <div>
                    <strong>{r.firstName} {r.lastName}</strong>
                  </div>
                  <small className="text-muted">
                    Født: {formatCpr(r.cprNr)}
                  </small>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <Alert variant="info" className="text-center">
              Ingen beboere fundet i systemet.
            </Alert>
          )}
        </div>
      </div>
    </Container>
  );
}
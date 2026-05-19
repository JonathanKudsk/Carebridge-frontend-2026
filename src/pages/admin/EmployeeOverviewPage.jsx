import { useEffect, useState } from "react";
import { Button, Table, Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { getCareworkers } from "../../api/api";

export default function EmployeeOverviewPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCareworkers()
      .then(setEmployees)
      .catch(() => setError("Kunne ikke hente medarbejdere"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>
      <h2 className="mb-4">Medarbejderoversigt</h2>
      {employees.length === 0 ? (
        <p className="text-muted">Ingen medarbejdere fundet.</p>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Navn</th>
              <th>E-mail</th>
              <th>Stilling</th>
              <th>Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td>{emp.displayName || emp.name}</td>
                <td>{emp.displayEmail || emp.email}</td>
                <td>{emp.role}</td>
                <td>
                  <Button
                    as={Link}
                    to={`/admin/employees/${emp.id}/journal`}
                    size="sm"
                    variant="primary"
                  >
                    Åbn journal
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}

import { Card, Button, ListGroup } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function JournalList({ journals }) {
  if (!journals.length) return <p className="text-muted">Ingen journaler oprettet endnu.</p>;

  return (
    <Card className="p-4 shadow-sm mx-auto" style={{ maxWidth: "800px" }}>
      <Card.Body>
        <Card.Title>Journaloversigt</Card.Title>
        <ListGroup>
          {journals.map((j) => {
            const detailPath =
              j.journalId && j.id
                ? `/journals/${j.journalId}/entries/${j.id}`
                : "/journal-overview";

            return (
              <ListGroup.Item key={j.id} className="d-flex justify-content-between">
                <div>
                  <strong>{j.title}</strong>
                  <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                    {j.createdAt}
                  </div>
                  <div style={{ maxWidth: "500px" }} className="text-truncate">
                    {j.content}
                  </div>
                </div>
                <Button variant="primary" as={Link} to={detailPath} state={{ entry: j }}>
                  Åbn
                </Button>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
        <div className="mt-3 text-end">
          <Button as={Link} to="/resident-overview">Opret journal entry</Button>
        </div>
      </Card.Body>
    </Card>
  );
}

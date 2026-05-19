import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Alert, Button, Card, Spinner, Table } from "react-bootstrap";
import { getJournalEntry } from "../../api/api";

function formatDateTime(value) {
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    return new Date(year, month - 1, day, hour, minute, second).toLocaleString(
      "da-DK",
    );
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("da-DK");
    }
  }

  return "Ukendt dato";
}

function getAnswers(entry) {
  return Array.isArray(entry?.journalEntryAnswerResponseDTO)
    ? entry.journalEntryAnswerResponseDTO
    : [];
}

function isMissingDetailResponse(error) {
  return [400, 404].includes(error?.response?.status);
}

export default function ShowJournalDetails() {
  const { journalId, entryId } = useParams();
  const { state } = useLocation();
  const fallbackEntry = state?.entry ?? null;
  const [entry, setEntry] = useState(fallbackEntry);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailWarning, setDetailWarning] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchEntry() {
      if (!journalId || !entryId) {
        setError("Journal entry kunne ikke findes.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      setDetailWarning("");

      try {
        const data = await getJournalEntry(journalId, entryId);
        if (isMounted) {
          setEntry(data);
        }
      } catch (err) {
        if (!isMissingDetailResponse(err)) {
          console.error("Kunne ikke hente journal entry:", err);
        }

        if (isMounted) {
          if (fallbackEntry) {
            setEntry(fallbackEntry);
            setDetailWarning(
              "Denne journal entry har ingen detaljerede svarfelter at vise.",
            );
          } else {
            setError("Journal entry kunne ikke hentes.");
            setEntry(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchEntry();

    return () => {
      isMounted = false;
    };
  }, [entryId, fallbackEntry, journalId]);

  if (isLoading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }

  if (!entry) {
    return <p>Journalen blev ikke fundet.</p>;
  }

  const answers = getAnswers(entry);

  return (
    <Card className="p-4 shadow-sm mx-auto" style={{ maxWidth: "900px" }}>
      <Card.Body>
        <Card.Title>{entry.title || "Uden titel"}</Card.Title>
        <Card.Subtitle className="mb-3 text-muted">
          {formatDateTime(entry.createdAt)} | Af: Bruger ID{" "}
          {entry.authorUserId || "Ukendt"}
        </Card.Subtitle>

        {detailWarning && <Alert variant="info">{detailWarning}</Alert>}

        <Table bordered responsive className="mb-4">
          <tbody>
            <tr>
              <th style={{ width: "180px" }}>Journal ID</th>
              <td>{entry.journalId}</td>
            </tr>
            <tr>
              <th>Type</th>
              <td>{entry.entryType || "-"}</td>
            </tr>
            <tr>
              <th>Risikoniveau</th>
              <td>{entry.riskAssessment || "-"}</td>
            </tr>
            <tr>
              <th>Oprettet</th>
              <td>{formatDateTime(entry.createdAt)}</td>
            </tr>
            <tr>
              <th>Opdateret</th>
              <td>{formatDateTime(entry.updatedAt)}</td>
            </tr>
          </tbody>
        </Table>

        <h2 className="h5 mb-3">Svar</h2>
        {answers.length > 0 ? (
          <div className="d-grid gap-3">
            {answers.map((answer, index) => (
              <div className="border rounded p-3 bg-light" key={answer.id ?? index}>
                <p className="fw-semibold mb-1">
                  {answer.field?.title || `Svar ${index + 1}`}
                </p>
                <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                  {String(answer.answer ?? "") || "-"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">Ingen svar fundet.</p>
        )}

        <Button as={Link} to="/journal-overview" className="mt-4">
          Tilbage til oversigten
        </Button>
      </Card.Body>
    </Card>
  );
}

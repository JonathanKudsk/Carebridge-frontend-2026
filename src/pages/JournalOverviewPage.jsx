import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  InputGroup,
  Spinner,
  Table,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getJournalEntries, getJournalEntry, getResidents } from "../api/api";

const PAGE_SIZE = 10;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

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

function dateToTime(value) {
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    return new Date(year, month - 1, day, hour, minute, second).getTime();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getResidentName(resident) {
  return [resident?.firstName, resident?.lastName].filter(Boolean).join(" ");
}

function getAnswers(entry) {
  return asArray(entry?.journalEntryAnswerResponseDTO);
}

function getAnswerText(entry) {
  return getAnswers(entry)
    .map((answer) => answer?.answer)
    .filter((answer) => answer !== null && answer !== undefined)
    .join(" ");
}

function normalizeSearch(value) {
  return String(value ?? "").toLowerCase();
}

function buildSearchText(entry) {
  return normalizeSearch(
    [
      entry.title,
      entry.entryType,
      entry.riskAssessment,
      entry.authorUserId,
      entry.residentName,
      formatDateTime(entry.createdAt),
      getAnswerText(entry),
      ...getAnswers(entry).map((answer) => answer?.field?.title),
    ].join(" "),
  );
}

function isMissingDetailResponse(error) {
  return [400, 404].includes(error?.response?.status);
}

export default function JournalOverviewPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchJournalEntries() {
      setIsLoading(true);
      setLoadError("");

      try {
        const residents = asArray(await getResidents()).filter(
          (resident) => resident?.journalId,
        );

        const entriesByResident = await Promise.all(
          residents.map(async (resident) => {
            try {
              const summaries = asArray(await getJournalEntries(resident.journalId));

              const detailedEntries = await Promise.all(
                summaries
                  .filter((entry) => entry?.id)
                  .map(async (entry) => {
                    const journalId = entry.journalId ?? resident.journalId;

                    try {
                      const details = await getJournalEntry(journalId, entry.id);
                      return { ...entry, ...details, journalId };
                    } catch (error) {
                      if (!isMissingDetailResponse(error)) {
                        console.error("Kunne ikke hente journal entry detaljer:", error);
                      }

                      return { ...entry, journalId };
                    }
                  }),
              );

              return detailedEntries.map((entry) => {
                const residentName = getResidentName(resident);
                return {
                  ...entry,
                  residentId: resident.id,
                  residentName,
                  searchText: buildSearchText({ ...entry, residentName }),
                };
              });
            } catch (error) {
              console.error("Kunne ikke hente journal entries for beboer:", error);
              return [];
            }
          }),
        );

        const nextEntries = entriesByResident
          .flat()
          .filter((entry) => entry.id && entry.journalId)
          .sort((a, b) => dateToTime(b.createdAt) - dateToTime(a.createdAt));

        if (isMounted) {
          setEntries(nextEntries);
        }
      } catch (error) {
        console.error("Fejl ved hentning af journaler:", error);
        if (isMounted) {
          setEntries([]);
          setLoadError("Kunne ikke hente journaler.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchJournalEntries();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEntries = useMemo(() => {
    const terms = normalizeSearch(searchQuery)
      .split(/\s+/)
      .filter(Boolean);

    if (terms.length === 0) {
      return entries;
    }

    return entries.filter((entry) =>
      terms.every((term) => entry.searchText.includes(term)),
    );
  }, [entries, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const pageEntries = filteredEntries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function handleSearch(event) {
    event.preventDefault();
    setSearchQuery(inputValue.trim());
    setCurrentPage(1);
  }

  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  }

  return (
    <Card className="p-4 shadow-sm mx-auto" style={{ maxWidth: "1100px" }}>
      <Card.Body>
        <Card.Title className="mb-4">Søg i Journaler</Card.Title>

        <Form onSubmit={handleSearch} className="mb-4">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Søg på titel, indhold, beboer, medarbejder..."
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              disabled={isLoading}
            />
            <Button variant="primary" type="submit" disabled={isLoading}>
              Søg
            </Button>
          </InputGroup>
        </Form>

        {loadError && <Alert variant="danger">{loadError}</Alert>}

        {isLoading && (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Henter journaler...</p>
          </div>
        )}

        {!isLoading && !loadError && filteredEntries.length === 0 && (
          <div className="text-center my-5 text-muted">
            <h5>Ingen journaler fundet</h5>
            <p>Prøv at justere din søgning eller brug færre ord.</p>
          </div>
        )}

        {!isLoading && !loadError && pageEntries.length > 0 && (
          <>
            <Table hover responsive className="mt-3 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Titel</th>
                  <th>Beboer</th>
                  <th>Dato</th>
                  <th>Medarbejder</th>
                  <th>Risikoniveau</th>
                </tr>
              </thead>
              <tbody>
                {pageEntries.map((entry) => (
                  <tr
                    key={`${entry.journalId}-${entry.id}`}
                    onClick={() =>
                      navigate(`/journals/${entry.journalId}/entries/${entry.id}`, {
                        state: { entry },
                      })
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <td className="fw-bold">{entry.title || "Uden titel"}</td>
                    <td>{entry.residentName || "Ukendt beboer"}</td>
                    <td>{formatDateTime(entry.createdAt)}</td>
                    <td>Bruger ID: {entry.authorUserId || "Ukendt"}</td>
                    <td>
                      <span
                        className={`badge ${
                          entry.riskAssessment === "HIGH"
                            ? "bg-danger"
                            : entry.riskAssessment === "MEDIUM"
                              ? "bg-warning text-dark"
                              : "bg-success"
                        }`}
                      >
                        {entry.riskAssessment || "LOW"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="d-flex justify-content-between align-items-center mt-4">
              <Button
                variant="outline-secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &larr; Forrige
              </Button>
              <span className="text-muted">
                Side {currentPage} af {totalPages}
              </span>
              <Button
                variant="outline-secondary"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Næste &rarr;
              </Button>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}
